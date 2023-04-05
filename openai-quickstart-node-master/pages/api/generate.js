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
  /*
  const animal = req.body.animal || '';
  if (animal.trim().length === 0) {
    res.status(400).json({
      error: {
        message: "Please enter a valid animal",
      }
    });
    return;
  }
*/
  try {
    const inputChunks = chunkInputText(inputText, 250); // break input into 250-character chunks
    const nrOfQuestionsToGenerate = questionPerChunk(inputChunks, amount);
    const completionPromises = inputChunks.map(chunk => {
      const prompt = quizMePrompt(trimUnfinishedSentences(chunk), nrOfQuestionsToGenerate); // vi skapar en prompt för varje chunk, det kan bli för många frågor då får vi rensa senare
      console.log(nrOfQuestionsToGenerate)
      return openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        temperature: 0.3,
        max_tokens: 2000,
        n: 1,
      });
    });
    const completions = await Promise.all(completionPromises);
    const generatedTexts = completions.map(completion => completion.data.choices[0].text);
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.log("alla skapade outputs: " + generatedTexts);
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
  if(amount==0){ //kommer dock aldrig hända om man inte ger 0 som input
    return '';
  }
  else{
    return `Give me ${amount} questions and corresponding answers on the following: ${input}, in the format of Q:questions A:answer`;

  }

}



function chunkInputText(inputText, chunkLimit) {

  const splitChunks = []; //en tom array där vi placerar alla våra delningar av inputtextene

  for (let i = 0; i < inputText.length; i += chunkLimit) { //gå igenom 
    splitChunks.push(inputText.slice(i, i + chunkLimit));
  }
  console.log(splitChunks);
  console.log("CHUNKY MONKY");
  return splitChunks;
}

function questionPerChunk(inputChunks, amountOfQuestions){ //fördela antalet questions på antalet chunks och ta bort om det blir för många
 
  const nrOfQuestionsPerChunk = Math.ceil(amountOfQuestions / inputChunks.length);
  return nrOfQuestionsPerChunk;


}

function trimUnfinishedSentences(generatedText) {

  // vi får flerea meningar - split into sentences
  const sentences = generatedText.match(/[^.?!\n]+[.?!\n]+/g) || [];

  // ta bort inkomplettea meningar, remove sentences not ending in . ? !
  const completeSentences = sentences.filter(sentence => {
    const trimmedSentence = sentence.trim();
    return trimmedSentence.length > 0 && trimmedSentence.charAt(trimmedSentence.length - 1).match(/[.?!]/);
  });
  return completeSentences;
}

function formatResult(generatedText, amount) { //tar in amount eftersom vi vill endast skapa så många frågor + svar som användaren satte
  // split the text into an array of questions and answers
  console.log("Innan splittext: " + generatedText);
  const splitText = generatedText.split("\n").filter((str) => str.trim() !== "");
  console.log("Splittext :  " + splitText)
  const numQuestions = splitText.length / 2;
  const formattedQuestions = [];
  const formattedAnswers = [];

  console.log(generatedText);
  // loop through each question-answer pair and format them
  for (let i = 0; i < amount; i++) {
    const question = splitText[i * 2]; // 0..2..4..
    const answer = splitText[i * 2 + 1]; //1..3..5

    formattedQuestions.push(`${i + 1}. ${question}`);
    formattedAnswers.push(`${i + 1}. ${answer}`);
  }

  // combine the formatted questions and answers into a single string
  const formattedOutput = `Generated Questions:\n\n${formattedQuestions.join("\n")}\n\nGenerated Answers:\n\n${formattedAnswers.join("\n")}`;
  console.log("KORREKTA: ______" + formattedOutput)
  return formattedOutput;
}

