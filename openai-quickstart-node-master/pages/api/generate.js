import { Configuration, OpenAIApi } from "openai";
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function (req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message: "OpenAI API key not configured, please follow instructions in README.md",
      }
    });
    return;
  }

  const inputText = req.body.inputText || '';
  if (inputText.trim().length === 0) {
    res.status(400).json({
      error: {
        message: "Please enter a valid text",
      }
    });
    return;
  }

  const amount = req.body.amount || '';
  if(amount <= 0){
    res.status(400).json({
      error: {
        message: "Please enter an amount bigger than 0",
      }
    });
    return;
  }
  

  try {
    const inputChunks = chunkUp(inputText, 250); // break input into 250-character chunks
    console.log(inputChunks)
    const nrOfQuestionsToGenerate = questionPerChunk(inputChunks, amount);
    const completionPromises = inputChunks.map(chunk => {
      const prompt = quizMePrompt(chunk, nrOfQuestionsToGenerate); // vi skapar en prompt för varje chunk, det kan bli för många frågor då får vi rensa senare
      console.log(nrOfQuestionsToGenerate)
      console.log("promt"+prompt);
      console.log("chunk"+ chunk);
      return openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        temperature: 0.3,
        max_tokens: 2000,
        n: 1,
      });
    });
    const completions = await Promise.all(completionPromises);
    console.log("completions000"+completions[0].data.choices[0].text);
    console.log("Completions"+completionPromises);
    const generatedTexts = completions.map(completion => completion.data.choices[0].text);
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.log("alla skapade outputs: " + generatedTexts);
    console.log("end");
    const formattedResult = formatResult(generatedTexts.join('\n'), amount); // alla strängarna i arrayen slängs ihop och skickas iväg som ett argument
    res.status(200).json({ result: formattedResult });
  } catch (error) {
    // Consider adjusting the error handling logic for your use case
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      res.status(500).json({
        error: {
          message: 'An error occurred during your request.',
        }
      });
    }
  }
}
function quizMePrompt(input, amount) {
  if (amount == 0) { //kommer dock aldrig hända om man inte ger 0 som input
    return '';
  }
  else {
    return `Give me ${amount} questions and corresponding answers on the following: ${input}, in the format of Q: questions A: answer, answer in the language similar to the provided notes`;
  }
}

function chunkUp(input, limit){
  const sentences = input.split(/[.!?]+\s*/);
  let finalChunk = [];
  let currentAdded = [];
  let stringCounter = 0;
  for (let i = 0; i < sentences.length; i++){
    stringCounter = stringCounter + sentences[i].length;
    currentAdded.push(sentences[i]);
    if (stringCounter > limit){
      finalChunk.push(currentAdded);
      currentAdded = [];
      stringCounter = 0;
    }
  }
  if (stringCounter > 0){
   finalChunk[finalChunk.length-1].push(currentAdded);
  }
  console.log("BEGIIIIIIIN" + finalChunk + "EEEEEEEEND");
  return finalChunk;
}

function questionPerChunk(inputChunks, amountOfQuestions) { //fördela antalet questions på antalet chunks och ta bort om det blir för många

  const nrOfQuestionsPerChunk = Math.ceil(amountOfQuestions / inputChunks.length);
  return nrOfQuestionsPerChunk;
}

function formatResult(generatedText, amount) { //tar in amount eftersom vi vill endast skapa så många frågor + svar som användaren satte
  // split the text into an array of questions and answers
  const splitText = generatedText.split("\n").filter((str) => str.trim() !== "");

  // loop through each question-answer pair and format them
  const qaArray = []
  for (let i = 0; i < amount; i++) {
    qaArray.push({ question: splitText[i * 2], answer: splitText[i * 2 + 1]});
  }
  console.log(qaArray);
  return qaArray;
}