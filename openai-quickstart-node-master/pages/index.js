import Head from "next/head";
import { useState } from "react";
import styles from "./index.module.css";
import localforage from "localforage";

export default function Home() {
  const [textInput, setTextInput] = useState("");
  const [result, setResult] = useState();
  const [amountInput, setAmountInput] = useState("");
  const [qaPairs, setQAPairs] = useState([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [indexQ, setIndexQ] = useState();
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [last, setLast] = useState();
  const [first, setFirst] = useState();

  // If using a module bundler like Webpack or Babel
const localforage = require('localforage');

// If including via CDN in an HTML file
<script src="https://cdnjs.cloudflare.com/ajax/libs/localforage/1.10.0/localforage.min.js"></script>
retrieveData();
  async function onSubmit(event) {
    event.preventDefault();
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
    
        body: JSON.stringify({ inputText: textInput, amount: amountInput }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      //setResult(data.result);
      console.log("IT starts here: " + data.result);
      const formattedResult = formatResult(data.result); //formateringen måste nu ändras när vi ändrat datastrukturen
      console.log("IT ends here: ");

      setResult(formattedResult);
      console.log("NEW LOG YIPPI: " + formattedResult);
      
      //ny metod som splittar upp i questions answers i array så att vi kan iterera varje steg för steg och sätta upp form och buttons för interaktion
      const test = trimUnfinishedSentences(data.result);
      console.log(test);
      

      console.log(trimUnfinishedSentences(data.result));
      setTextInput("");
      let arr = formatResult(data.result);
      console.log(arr);


      setAmountInput("");
      setQAPairs(createQAPairs(data.result));

      console.log(qaPairs);

      console.log(qaPairs[0]);

    } catch(error) {
      // Consider implementing your own error handling logic here
      console.error(error);
      alert(error.message);
    }
  }  

  function createQAPairs(result){
    console.log("Så här ser datan ut direkt: " + result)

    const regex = /\d+\. Q: (.+)\n/g;
    const questions = [];
    const regexA = /\d+\. A: (.+)/g;

    ; //ta bort
    const answers = [];
    
    let match;
    let matchA;
    const qaPairs = [];

    let resultCopy = result; // make a copy of the original string


    while ((match = regex.exec(result)) !== null) { //fortsätter så länge den hittar ny occurance som matchar
      questions.push(match[1]);
      console.log("match: " + match[1])

      //answers.push(match[1])
      /*qaPairs.push({
        question: match[1],
        answer: match[1],
      });
      */
    }
    let matchCopy = regex.exec(result);
    console.log("Questions  copies." + matchCopy);
    //let matchACopy = regexA.exec(result);
    //console.log("Answers copies: " + matchACopy);
    resultCopy = result; // reset the copy for the second loop

    while ((matchA = regexA.exec(resultCopy)) !== null) {
      //questions.push(match[1]);
      answers.push(matchA[1])
      console.log("matchA: " + matchA[1])
      console.log("Hela: " + matchA);
    }
    for (let i = 0; i < questions.length; i++) {
      let j = i;
      const subArray = [questions[i], answers[i]];
      //qaPairs.push(subArray);
      j++;
      qaPairs.push({
        question: `Question: ${j} : ${questions[i]}`,
        answer: `Answer: ${j} : ${answers[i]}`,
      });
    }


    
    console.log(qaPairs);
    setIndexQ(0);
    setCurrentQuestion(qaPairs[0].question);
    setCurrentAnswer(qaPairs[0].answer);
    setLast(false);
    setFirst(true);

    storeData(qaPairs);
    return qaPairs;
  }
  

  function showNext(){
    if (indexQ+1 < qaPairs.length){
      setCurrentQuestion(qaPairs[indexQ+1].question);
      setCurrentAnswer(qaPairs[indexQ+1].answer);
      if (indexQ+1==qaPairs.length-1){
        setLast(true);
      }
      setIndexQ(indexQ+1);
      setShowAnswers(false);
      setFirst(false);
    }
  }

  function showPrevious(){
    if (indexQ-1 >= 0){
      setCurrentQuestion(qaPairs[indexQ-1].question);
      setCurrentAnswer(qaPairs[indexQ-1].answer);
      if (indexQ-1==0){
        setFirst(true);
      }
      setIndexQ(indexQ-1);
      setShowAnswers(false);
      setLast(false);
    }
  }

  return (
    <div>
      <Head>
        <title>QuizGenius</title>
        <link rel="icon" href="/QuizGenius-Q.png" />
      </Head>

      <main className={styles.main}>
        <div>
        <img src="/QuizGenius-1.png" className={styles.icon} />

        </div>
        <div>
        <h3>Autogenerate quiz questions for your own text</h3>

        </div>
        <div class="containerForm">
          <form onSubmit={onSubmit}>
          <div class="textAreaInput">
          <textarea 
            class="text-input" 
            type = "text"
            placeholder="Type your text: "
            rows="4" 
            cols="50"
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
          ></textarea>
        </div>
          

          <div name="numberOfQuestions">
            <input 
            type="text" 
            name="amount" 
            placeholder="Number of questions" 
            value={amountInput} 
            onChange={(f) => setAmountInput(f.target.value)}
          />
          </div>
          
          <input type="submit" class="submitButton" value="Generate questions"/>
          
          </form>
        </div>
        
        <div className={styles.result1}>
          {qaPairs.length > 0 && (
            <button className="hideShow" onClick={() => setShowAnswers(!showAnswers)}>
              {showAnswers ? "Hide Answers" : "Show Answers"}
            </button>
          )}
        </div>    
        <div className={styles.result2}>
          <div className={styles.containerLeftArrow}>
            {!first && <button className={styles.buttonleft} onClick={()=> showPrevious()}> </button>}
          </div>

          <div className={styles.questionAndAnswer}>
            {currentQuestion}
            {showAnswers && <p className={styles.answer}> {currentAnswer}</p>}
          </div>

          <div className={styles.containerRightArrow}>
            {!last &&<button className={styles.buttonright} onClick={()=> showNext()}></button>}
          </div>    

        </div>      
      </main>
    </div>
  );
}

function trimUnfinishedSentences(generatedText){

// Match the end of sentences and split the output into sentences
const sentences = generatedText.match(/[^.?!\n]+[.?!\n]+/g) || [];

// Filter out incomplete sentences
const completeSentences = sentences.filter(sentence => {
  const trimmedSentence = sentence.trim();
  return trimmedSentence.length > 0 && trimmedSentence.charAt(trimmedSentence.length - 1).match(/[.?!]/);
});
return completeSentences;
}





function formatResult(generatedText)
{
  //const regexAnswer = /A\d+: ([^A].+?)(?=Q\d+|$)/gs;
  const regexAnswer = /^(\d+)\. (Q): (.*)$/gm;
  const regexQuestion = /^(\d+)\. (A): (.*)$/gm; //ändrad båda för att matcha den nya strukturen


  const answersNew = generatedText.match(regexAnswer).map(a => a.replace(/A\d+: /, '')); 

  console.log(generatedText);

  const questionsReg= generatedText.match(regexQuestion).map(q => q.replace(/Q\d+: /, ''));
  

  console.log("Questions från regen: " + questionsReg);
  console.log("Answers från regen: " + answersNew);

  const formattedQuestions = questionsReg.join('\n\n');
  const formattedAnswers = answersNew.join('\n\n');
  const result = `Generated Questions: \n\n${formattedQuestions}\n\nGenerated Answers:\n\n${formattedAnswers}`;

  const resultArray = questionsReg.map((question, index) => ({
    question,
    answer: answersNew[index],
    showAnswer: false
  }));
  console.log(resultArray);

  return result;
}


function storeData(qaPairs){

  localforage.setItem('qaPairs', qaPairs)
  .then(() => {
    console.log("Array stored!");

  })
  .catch((error) => {
    console.error('Error storing: ' , error);
  });



}


function retrieveData(){

localforage.getItem('qaPairs')
  .then((storedQAPairs) => {
    console.log('Retrieved qaPairs: ', storedQAPairs)
  })
  .catch((error) => {
    console.error('Error retrieving data: ', error)
  });
}

