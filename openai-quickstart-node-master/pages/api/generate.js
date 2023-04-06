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
      const prompt = quizMePrompt(chunk, nrOfQuestionsToGenerate); // vi skapar en prompt för varje chunk, det kan bli för många frågor då får vi rensa senare
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
  if (amount == 0) { //kommer dock aldrig hända om man inte ger 0 som input
    return '';
  }
  else {
    return `Give me ${amount} questions and corresponding answers on the following: ${input}, in the format of Q: questions A: answer`;

  }

}



function chunkInputText(inputText, chunkLimit) {

  //splitta hela inputText där det finns punkter
  const sentences = inputText.split(/[.!?]+\s*/); //splittar vid slutet på en mening


  let chunkArray = [];
  let arr = [];

  let stringCounter = 0;

  
  for (let i = 0; i < sentences.length; i++) { //loopa igenom hela sentences arrayen


    stringCounter = stringCounter + sentences[i].length; //vi har en string counter för att räkna hur långa alla strängarna i arrayen är tillsammsn
    arr.push(sentences[i]); //vi skickar in våra sentences i array
    if (stringCounter > chunkLimit) { //chunken är tillräckligt lång och vi är klara med den
      chunkArray = chunkArray.concat(arr); //vi storar våra menignar i chunkarray
      for(let i = 0; i<arr.length; i++){
        console.log("Mellan arrayeN: " + arr[i]);
      }
      arr.length = 0; //vi clearar den temporära arrayen
      stringCounter = 0; //resetar string counter
      
    } //måte också kunna hantera om vi aldrig når upp till gränsen eftersom en person kanske lämna in en väldigt kort text och vi vill fortfarande skicka den vidare
    
  }
  if(arr.length > 0){ //vi har en sista inkomplett chunk vi behöver skicka vidare
    
    for(let i = arr.length-1; i>0; i--){ //det skapas en tom sträng i slutet på sista arrayen/chunken så vi tar bort den med splice
      if(arr[i] === ''){
        arr.splice(i, 1);
      }
    }
    chunkArray = chunkArray.concat(arr)

  }
  
  console.log(chunkArray);
  console.log("CHUNKY MONKY");
  return chunkArray;
}

function questionPerChunk(inputChunks, amountOfQuestions) { //fördela antalet questions på antalet chunks och ta bort om det blir för många

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
    console.log("KLOCK: " + i);
  }

  // combine the formatted questions and answers into a single string
  const formattedOutput = `Generated Questions:\n\n${formattedQuestions.join("\n")}\n\nGenerated Answers:\n\n${formattedAnswers.join("\n")}`;
  console.log("KORREKTA: ______" + formattedOutput)
  return formattedOutput;
}

