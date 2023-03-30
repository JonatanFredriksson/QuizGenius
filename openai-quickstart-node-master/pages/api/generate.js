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
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: quizMePrompt(trimUnfinishedSentences(inputText)),
      temperature: 0.3,
      max_tokens: 3700,
      n:1,
    });

    res.status(200).json({ result: completion.data.choices[0].text });

    //formatResult(response.choices[0].text); //skicka iväg datan till en metod som formaterar
    //`Generated Questions:\n\n${formattedQuestions}\n\nGenerated Answers:\n\n${formattedAnswers}`;
  } catch(error) {
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
function quizMePrompt(input){
  let instruction = 'Give me 5 questions and corresponding answers on the following: ';
  let combined = instruction + input;
  
  return combined
}
function generatePromptSimple(){
  return 'What is the meaning of life?'
}

function generatePrompt(animal) {
  const capitalizedAnimal =
    animal[0].toUpperCase() + animal.slice(1).toLowerCase();
  return `Suggest three names for an animal that is a superhero.

Animal: Cat
Names: Captain Sharpclaw, Agent Fluffball, The Incredible Feline
Animal: Dog
Names: Ruff the Protector, Wonder Canine, Sir Barks-a-Lot
Animal: ${capitalizedAnimal}
Names:`;
}


/*function generateQuizPrompt(inputText) {
  // Use NLP or keyword extraction to identify relevant topics or concepts
  const topics = extractTopics(inputText);

  // Generate quiz questions based on the identified topics
  const questionsAndAnswers = generateQuestions(topics);

  // Generate the prompt string
  let quizPrompt = `Welcome to the quiz! Answer the following questions about ${topics.join(", ")}:\n\n`;
  quizPrompt += questionsAndAnswers.map((qa, i) => `${i+1}. ${qa.question}`).join("\n\n");

  return quizPrompt;
}
*/
function trimUnfinishedSentences(generatedText){

  // vi får flerea meningar - split into sentences
  const sentences = generatedText.match(/[^.?!\n]+[.?!\n]+/g) || [];
  
  // ta bort inkomplettea meningar, remove sentences not ending in . ? !
  const completeSentences = sentences.filter(sentence => {
    const trimmedSentence = sentence.trim();
    return trimmedSentence.length > 0 && trimmedSentence.charAt(trimmedSentence.length - 1).match(/[.?!]/);
  });
  return completeSentences;
  }



async function generateQuizPrompt(prompt, numQuestions) {

  // Use the OpenAI API to generate the quiz questions and answers
  const response = await openai.completions.create({
    engine: 'davinci',
    prompt: `${prompt}\n\nGenerate ${numQuestions} quiz questions with matching answers:\nQuestion 1:`,
    max_tokens: 1024,
    n: 1,
    stop: "\n\n"
  });

  let trimMe = `${prompt}\n\nGenerate ${numQuestions} quiz questions with matching answers:\nQuestion 1:`;

  const generatedText = response.choices[0].text.trim();

  // Extract the generated questions and answers from the response
  const questionsAndAnswers = generatedText.split("\nQuestion").slice(1).map(qa => {
    const [question, answer] = qa.trim().split("\nAnswer: ");
    return {question: question.trim(), answer: answer.trim()};
  });

  // Generate the prompt string
  let quizPrompt = `Welcome to the quiz! Answer the following questions:\n\n`;
  quizPrompt += questionsAndAnswers.map((qa, i) => `${i+1}. ${qa.question}`).join("\n\n");

  return quizPrompt;
}
