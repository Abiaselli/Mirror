// This file includes the refactored, modular version of Mirror components in JavaScript.

// Compiler/LLM wrapper with modifiable model name.
class MirrorCompiler {
    constructor(model) {
        this.model = model || "meta-llama-3-8b-instruct"; // Default if no model is provided
    }

    async callLocalLLM(prompt) {
        const response = await fetch("http://127.0.0.1:1234/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: this.model,
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error?.message || "Unknown error");
        }
        return data.choices[0].message.content;
    }

    async getAvailableModels() {
        const response = await fetch("http://127.0.0.1:1234/v1/models", {
            method: "GET"
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error?.message || "Unknown error");
        }
        return data.models;
    }
}

// Parser for Mirror Language
class MirrorParser {
    constructor(input) {
        this.tokens = input.match(/\w+|->|[.,:()\[\]{}]|"(?:\\"|[^"])*"|\d+|\S/g) || [];
        this.current = 0;
    }

    parse() {
        const program = [];
        while (!this.isAtEnd()) {
            const stmt = this.parseStatement();
            if (stmt) {
                program.push(stmt);
            }
        }
        return program;
    }

    parseStatement() {
        if (this.match('signature')) {
            return this.parseSignature();
        } else if (this.match('example')) {
            return this.parseExample();
        } else if (this.peekIdentifier()) {
            return this.parseExpression();
        } else {
            throw new Error(`Unexpected token: ${this.peek()}`);
        }
    }

    parseSignature() {
        const name = this.consumeIdentifier();
        this.consume('(');
        const parameters = this.parseParameters();
        this.consume(')');
        this.consume('->');
        const returnType = this.parseType();
        return { type: 'signature', name, parameters, returnType };
    }

    parseParameters() {
        const parameters = [];
        do {
            const name = this.consumeIdentifier();
            this.consume(':');
            const paramType = this.parseType();
            parameters.push({ name, type: paramType });
        } while (this.match(','));
        return parameters;
    }

    parseType() {
        if (this.match('string', 'number', 'bool')) {
            return this.previous();
        } else if (this.match('list[')) {
            const innerType = this.parseType();
            this.consume(']');
            return { type: 'list', innerType };
        } else if (this.match('dict{')) {
            const innerType = this.parseType();
            this.consume('}');
            return { type: 'dict', innerType };
        } else {
            throw new Error(`Unexpected type: ${this.peek()}`);
        }
    }

    parseExample() {
        const name = this.consumeIdentifier();
        this.consume('(');
        const literals = this.parseLiterals();
        this.consume(')');
        this.consume('=');
        const literal = this.parseLiteral();
        return { type: 'example', name, literals, result: literal };
    }

    parseLiterals() {
        const literals = [];
        do {
            literals.push(this.parseLiteral());
        } while (this.match(','));
        return literals;
    }

    parseLiteral() {
        if (this.match('true', 'false')) {
            return this.previous();
        } else if (this.matchNumber()) {
            return parseFloat(this.previous());
        } else if (this.matchString()) {
            return this.previous();
        } else if (this.match('[')) {
            const literal = this.parseLiteral();
            this.consume(']');
            return { type: 'list', value: literal };
        } else if (this.match('{')) {
            const key = this.parseLiteral();
            this.consume(':');
            const value = this.parseLiteral();
            this.consume('}');
            return { type: 'dict', key, value };
        } else {
            throw new Error(`Unexpected literal: ${this.peek()}`);
        }
    }

    parseExpression() {
        const name = this.consumeIdentifier();
        this.consume('(');
        const mix = this.parseMix();
        this.consume(')');
        return { type: 'expression', name, mix };
    }

    parseMix() {
        const mix = [];
        do {
            if (this.peekIdentifier()) {
                mix.push(this.parseExpression());
            } else {
                mix.push(this.parseLiteral());
            }
        } while (this.match(','));
        return mix;
    }

    // Helper methods
    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    matchNumber() {
        const token = this.peek();
        if (/^\d+(\.\d+)?$/.test(token)) {
            this.advance();
            return true;
        }
        return false;
    }

    matchString() {
        const token = this.peek();
        if (/^".*"$/.test(token)) {
            this.advance();
            return true;
        }
        return false;
    }

    consume(type) {
        if (this.check(type)) {
            return this.advance();
        }
        throw new Error(`Expected '${type}', but got '${this.peek()}'`);
    }

    consumeIdentifier() {
        if (this.peekIdentifier()) {
            return this.advance();
        }
        throw new Error(`Expected identifier, but got '${this.peek()}'`);
    }

    check(type) {
        if (this.isAtEnd()) return false;
        return this.peek() === type;
    }

    peek() {
        return this.tokens[this.current];
    }

    peekIdentifier() {
        const token = this.peek();
        return /^[a-zA-Z_]\w*$/.test(token);
    }

    previous() {
        return this.tokens[this.current - 1];
    }

    advance() {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    isAtEnd() {
        return this.current >= this.tokens.length;
    }
}

// Compilation Manager
async function compile(rawCode, model = "tinyllama-claude") {
    try {
        const parser = new MirrorParser(rawCode);
        const ast = parser.parse();
        const reorganizedAST = groupSignaturesWithExamples(ast);

        // Updated prompt structure with detailed instructions
        const prompt = `I want you to generate the function body in JavaScript for the function signature that I give you.
I will also give you several examples of inputs with the expected results. Do not use any additional libraries. Do not give any explanation. 
Do not format it as Markdown. Only give the function and the function call expressions afterwards if applicable. Do not include ANY extraneous text.

${JSON.stringify(reorganizedAST, null, 2)}
${JSON.stringify(expressionsoutput, null, 2)}


Generate JavaScript code that satisfies these function signatures, examples, and expressions.`;

        const compiler = new MirrorCompiler(model);
        const generatedCode = await compiler.callLocalLLM(prompt);

        return generatedCode;
    } catch (error) {
        throw new Error(`Compilation failed: ${error.message}`);
    }
}

// AST Helper Functions
function extractExpressions(ast) {
    return ast.filter(node => node.type === 'expression');
}

function groupSignaturesWithExamples(ast) {
    const signatures = ast.filter(node => node.type === 'signature');
    const examples = ast.filter(node => node.type === 'example');

    return signatures.map(signature => {
        const matchingExamples = examples.filter(example => example.name === signature.name);
        return {
            ...signature,
            examples: matchingExamples
        };
    });
}

// Attach classes and functions to the window object for global access
window.MirrorParser = MirrorParser;
window.MirrorCompiler = MirrorCompiler;
window.compile = compile;
window.extractExpressions = extractExpressions;
window.groupSignaturesWithExamples = groupSignaturesWithExamples;
