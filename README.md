# Mirror: An LLM-powered programming-by-example programming language. (modified to be compatible with LM Studio)

For more details, see the [blog post](https://austinhenley.com/blog/mirrorlang.html).

<img width="1080" alt="mirrorplayground" src="https://github.com/user-attachments/assets/95c21c7c-1613-4d0d-a565-54115f186e80">

In the Mirror programming language, you define functions by providing sets of input-outputs pairs and you can call those functions. That is it. The entire program behavior must be specified through those examples.

```
signature is_even(x: number) -> bool
example is_even(0) -> true
example is_even(1) -> false
example is_even(222) -> true
example is_even(-99) -> false

is_even(12345)
```

<p>Using the Mirror syntax, you give the function name, parameters and their types, and the return type as well as one or more examples with the expected result. It uses a strict syntax and supports a handful of types (including lists). You can create multiple functions and chain them.</p>

<p>After parsing, the "compiler" uses an LLM to generate JavaScript that satisfies the constraints expressed by the examples. You should review the generated code to verify it is correct, or provide more examples and recompile it. When you run it, the last value will be printed.


Addendum From Austin Biaselli: 
Hello, this branch was created by me, Austin Biaselli, a different Austin from the original creator, as an alternative to using OpenAi's API key for the "Mirror" LLM programming concept. This is compatible with, at the very least, LM Studio with the completions API enabled in its developer mode. CORS should be enabled to interact with the HTML playgroud, and it should be on port 1234 (although you can modify this in the code if necessary to use alternate ports.) I reformatted the code and made some small changes to make this so it will work completely disconnected from the internet, which required including ace.min.js in the directory so it didn't need to be accessed remotely. You can alter the model name in the code if you want because it is set to Llama-8B-Instrcut, but it should work with whatever you have loaded (but will default to LLama-8B-Instruct if it's available in the loaded model list, or potentially if you have in your model list and have "just in time" enabled). Larger models will work better, depending on what you need it to do. You can modify the prompt in the HTML if you would like the model to include an explanation of the code. This is an example of a prompt you could set in the backend to get smaller models to output what you need (this is modelled specifically to the example function, make sure to edit it to align with your code to allow smaller LLMs to handle complicated expressions): 

<donotinclude>`I want you to generate the function body in JavaScript for the function signature that I give you.

Here are the function signatures, examples, and expressions in the Mirror language:

- Signatures: Describe the function signature, inputs, and expected output type.
- Examples: Show how the function should behave with different inputs.
- Expressions: Show the composition of these functions.

Grammar Documentation:
- 'signature': Defines a function signature with a name, parameters, and a return type.
- 'example': Provides example inputs and outputs for a function, describing how it should behave.
- 'expression': Represents a function call or a composition of multiple functions.
- 'literal': Represents a constant value, which can be a number, string, boolean, list, or dictionary.

Descriptions of Expected Behavior:
. Function foo(x: number, y: number) -> number: 
   - This function takes a number x and repeats it y times to form a larger number. For example:
     - foo(10, 3) should return 101010.
     - foo(1, 1) should return 1.
     - foo(0, 10 should return 0.
     
2. Function bar(x: number) -> string: 
   - This function takes a number x and returns a string indicating the length of the number. For example:
     - bar(9) should return length is 1".
     - bar(3210) should return "length is 4".

Here are the provided function details:

${reorganizedASToutput}

Generate JavaScript code that satisfies these function signatures, examples, and expected behaviors.`</donotinclude>

It might be worth modifying the code to parse this information on its own, or allow you to enter this into the textbox, but at that point you may as well just ask the LLM in chat. At some point I may modify this to cycle through two LLMs, or the same LLM twice, with the first one formatting the information in a specific way to get the second one to output things correctly, but none of this will be necessary with a larger LLM. A backup of the prompt is included in the mirror.js file, if you decide to edit the HTML, but it should currently load the HTML prompt unless something goes wrong.

All credit goes to the original author! I just modded it to work locally

-Austin B.
