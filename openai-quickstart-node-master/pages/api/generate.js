import { Configuration, OpenAIApi } from "openai";
import localforage from "localforage";

// If using a module bundler like Webpack or Babel
//const localforage = require('localforage'); //för att stora i local

// If including via CDN in an HTML file
<script src="https://cdnjs.cloudflare.com/ajax/libs/localforage/1.10.0/localforage.min.js"></script>
//retrieveData();

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


  //definierar våra variabler från index
  const inputText = req.body.inputText || '';
  if (inputText.trim().length === 0) {
    res.status(400).json({
      error: {
        message: "Please enter a valid text",
      }
    });
    return;
  }
  const questionMode = req.body.questionMode || false;


  const amount = req.body.amount || 0;
  if (amount === 0 && questionMode==true) {
    res.status(400).json({
      error: {
        message: "Please enter a valid number",
      }
    });
    return;
  }


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
    console.log(questionMode);

    let completion = "";
    let completions = [];

    if(questionMode===true){ //vi kör  en fråga modet
      const inputChunks = chunkInputText(inputText, 200); // break input into 200-character chunks, mindre eftersom vi inte vill alltid ha samma frågor

      const randomIndex = Math.floor(Math.random() * inputChunks.length);

      const randomChunk = inputChunks[randomIndex];
      const prompt = quizMePrompt(randomChunk, 1);


      completion = await openai.createCompletion({ // call createCompletion once with the prompt
        model: "text-davinci-003",
        prompt: prompt,
        temperature: 0.7,
        max_tokens: 3000,
        n: 1,
      });

      completions.push(completion); //neandertalar kod
      
    }
    else{ // vi kör flera flera frågor modet
      const inputChunks = chunkInputText(inputText, 500); // break input into 250-character chunks
      let nrOfQuestionsToGenerate = questionPerChunk(inputChunks, amount);
      console.log("Antalet gånger: " + inputChunks.length);
  
  

      const completionPromises = inputChunks.map(chunk => { //Vi verkar endast utföra loopen fyran gånger
        if(nrOfQuestionsToGenerate==2){
          nrOfQuestionsToGenerate=3; //av nån anledning, kanske apin så är just två buggigt, så vi får köra en extra fråga och svar
        }
        const prompt = quizMePrompt(chunk, nrOfQuestionsToGenerate); // vi skapar en prompt för varje chunk, det kan bli för många frågor då får vi rensa senare
        console.log("Detta är chunken vi skickar in i prompt: " + chunk);
        console.log("Detta är antalet frågor som chunken ska besvara: " + nrOfQuestionsToGenerate);
        console.log("Prompten: " + prompt);
        
        return openai.createCompletion({
          model: "text-davinci-003",
          prompt: prompt,
          temperature: 0.3,
          max_tokens: 3000,
          n: 1,
        });
      });
      completions = await Promise.all(completionPromises);
      console.log("HELA: " + completions);
      
    }

   
    

    
    
    console.log("DO WE REACH IT");
    const generatedTexts = completions.map(completion => completion.data.choices[0].text);
    console.log("alla skapade outputs: " + generatedTexts);
    let tempAmount = amount;
    if(questionMode===true){ //eftersom vi inte definierar amount om vi kör utan set amount of questions så sätter vi den till 1
      tempAmount = 1;
    }
    
    const formattedResult = formatResult(generatedTexts.join('\n'), tempAmount); // alla strängarna i arrayen slängs ihop och skickas iväg som ett argument
    
    res.status(200).json({ result: formattedResult, questionMode: questionMode});
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
function quizMePrompt(input, amount, questionMode) {
  if (amount == 0) { //kommer dock aldrig hända om man inte ger 0 som input
    console.log("WARNING!!!!!!");
    return '';
    
  }
  if(questionMode===true){
    return 'Give me a question and corresponding answer different from the previous ones on the specific text, in the format of: \nQ: question \nA: answer. \nTry to answer in the same language as the provided notes. Example Output: \nQ: What is the capital of France?\nA: The capital of France is Paris. \nQ: What is the capital of Germany?\nA: The capital of Germany is Berlin.\nThe following is the text to analyze: ${input} \n:END OF INPUT TEXT TO ANALYZE;';
  }
  else if(amount == 1 ){
    return `Give me ${amount} question and corresponding answer on the specific text, in the format of, \nQ: question \nA: answer. \nTry to answer in the same language as the provided notes. Example Output: \nQ: What is the capital of France?\nA: The capital of France is Paris. \nThe following is the text to analyze: ${input} \n:END OF INPUT TEXT TO ANALYZE`;

  }
  else {
    return `Give me ${amount} questions and corresponding answers on the specific text, in the format of: \nQ: question \nA: answer. \nTry to answer in the same language as the provided notes. Example Output: \nQ: What is the capital of France?\nA: The capital of France is Paris. \nQ: What is the capital of Germany?\nA: The capital of Germany is Berlin.\nThe following is the text to analyze: ${input} \n:END OF INPUT TEXT TO ANALYZE`;

  }

}



function chunkInputText(inputText, chunkLimit) {

  //splitta hela inputText där det finns punkter
  //const sentences = inputText.split(/[.!?]+\s*/); //splittar vid slutet på en mening
  const sentences = inputText.split(/[.!?]+\s*|\n+/); //splittar vid 0 ! ? och newline eftersom antecknignar ofta inte har punkter utan 

  let chunkArray = [];
  let arr = [];
  let stringCounter = 0;
  for (let i = 0; i < sentences.length; i++) { //loopa igenom hela sentences arrayen


    if(sentences[i] === ''){
      console.log("Den är tom chunkbit" + sentences[i]);
    }
    else{
      console.log("Chunkbit: " + sentences[i]);

      stringCounter = stringCounter + sentences[i].length; //vi har en string counter för att räkna hur långa alla strängarna i arrayen är tillsammsn
      arr.push(sentences[i]); //vi skickar in våra sentences i array
      if (stringCounter > chunkLimit) { //chunken är tillräckligt lång och vi är klara med den
        chunkArray.push(arr); //stora meningarna i nya arrayen som är för HELA chunken
        arr = []; // Reset arr to an empty array
  
        console.log("Slut");
        //arr.length = 0; //vi clearar den temporära arrayen
        stringCounter = 0; //resetar string counter
  
      } //måte också kunna hantera om vi aldrig når upp till gränsen eftersom en person kanske lämna in en väldigt kort text och vi vill fortfarande skicka den vidare
      


    }

    
  }

  

  if(arr.length > 0 && chunkArray[0] === undefined){ //vi har kvar en chunk som sista som ska läggas till, too keep it simple så inkluderar vi den i föregående chunken, men i denn if så finns det ingen föregående så vi endast pushar
    //chunkArray.push(arr);
    console.log("Vi pushar sista chunken och det fanns ingen innan: " + arr);
    //chunkArray[chunkArray.length - 1] = [...chunkArray[chunkArray.length - 1], ...arr];

    chunkArray.push(arr);
    

  }
  else if(arr.length > 0){ //vi har kvar en chunk som sista som ska läggas till, too keep it simple så inkluderar vi den i föregående chunken, 
    

    console.log("Vi pushar sista chunken och det fanns innan: " + chunkArray.length);
    chunkArray[chunkArray.length - 1] = [...chunkArray[chunkArray.length - 1], ...arr];

  }

  for(let i = 0; i<chunkArray.length; i++){
    console.log("Whole chunk: " + i + chunkArray[i]);
  }

  /*
  if (arr.length > 0) { //vi har en sista inkomplett chunk vi behöver skicka vidare

    for (let i = arr.length - 1; i > 0; i--) { //det skapas en tom sträng i slutet på sista arrayen/chunken så vi tar bort den med splice
      if (arr[i] === '') {
        arr.splice(i, 1);
      }
    }
    chunkArray = chunkArray.concat(arr)

  }
*/
  console.log("Chunk Array X: ", chunkArray); // add this line to print out the chunk array
  console.log("CHUNKY MONKY");
  
  return chunkArray;
}

function questionPerChunk(inputChunks, amountOfQuestions) { //fördela antalet questions på antalet chunks och ta bort om det blir för många

  let nrOfQuestionsPerChunk = Math.ceil(amountOfQuestions / inputChunks.length);
  return nrOfQuestionsPerChunk;


}

function formatResult(generatedText, amount) { //tar in amount eftersom vi vill endast skapa så många frågor + svar som användaren satte
  // split the text into an array of questions and answers
  console.log("Innan splittext: " + generatedText);
  const splitText = generatedText.split("\n").filter((str) => str.trim() !== "");
  console.log("Splittext :  " + splitText)

  console.log("Antalet frågor som interfacet ska visa:  " + amount);
  const numQuestions = splitText.length / 2;
  const formattedQuestions = [];
  const formattedAnswers = [];

  let sendMeToIndex = [];

  console.log(generatedText);
  // loop through each question-answer pair and format them
  for (let i = 0; i < amount; i++) {
    const question = splitText[i * 2]; // 0..2..4..
    const answer = splitText[i * 2 + 1]; //1..3..5

    if (!question.length || !answer.length) {
      console.log("Either question or answer is empty.");
    }    formattedQuestions.push(`${i + 1}. ${question}`);
    formattedAnswers.push(`${i + 1}. ${answer}`);
    console.log("KLOCK: " + i);

    var qaPair = {
      question: i, question,
      answer: i, answer,
      ShowAnswer: false

    };

    sendMeToIndex.push(qaPair);

    /*
    sendMeToIndex.push({
      question: `Question: ${i} : ${question}`,
      answer: `Answer: ${i} : ${answer}`,
    });'
    */
  }

  // combine the formatted questions and answers into a single string
  //const formattedOutput = `Generated Questions:\n\n${formattedQuestions.join("\n")}\n\nGenerated Answers:\n\n${formattedAnswers.join("\n")}`;
  //console.log("KORREKTA: ______" + formattedOutput)

  //istället för att returna en string, reuturna en array som är i rätt format

  //storeData(sendMeToIndex); //vi spara vår data

  return sendMeToIndex;
}


//Localforage//Localstorage

/*
function storeData(qaPairs) {

  localforage.setItem('qaPairs', qaPairs)
    .then(() => {
      console.log("Array stored!");

    })
    .catch((error) => {
      console.error('Error storing: ', error);
    });



}


function retrieveData() {

  localforage.getItem('qaPairs')
    .then((storedQAPairs) => {
      console.log('Retrieved qaPairs: ', storedQAPairs)
    })
    .catch((error) => {
      console.error('Error retrieving data: ', error)
    });
}

*/