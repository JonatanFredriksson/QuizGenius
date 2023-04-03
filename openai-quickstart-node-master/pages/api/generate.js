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
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: quizMePrompt(trimUnfinishedSentences(inputText), amount),
      temperature: 0.3,
      max_tokens: 2000,
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
function quizMePrompt(input, amount){
  return `Give me ${amount} questions and corresponding answers on the following: ${input} `;
  
}







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



