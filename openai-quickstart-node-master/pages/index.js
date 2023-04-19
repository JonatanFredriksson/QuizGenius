import Head from "next/head";
import { useState } from "react";
import styles from "./index.module.css";

export default function Home() {
  const [textInput, setTextInput] = useState("");
  const [amountInput, setAmountInput] = useState();
  const [qaPairs, setQAPairs] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [indexQ, setIndexQ] = useState();
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [last, setLast] = useState();
  const [first, setFirst] = useState();
  const [shownText, setShownText] = useState();
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [rwAnswers, setRWAnswers] = useState([]);



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
      console.log("This is the data: " + data.result);
      const formattedResult = (data.result); //formateringen måste nu ändras när vi ändrat datastrukturen, vi skippar detta steg, formatterar i generate istället
      setQAPairs(formattedResult); //vi sätter datan i variabeln qaPairs

      console.log(qaPairs);
      console.log(formattedResult);
      //console.log(trimUnfinishedSentences(data.result)); //fungerar inte just nu med arrayen

      initializeArrows(formattedResult);

    } catch (error) {
      // Consider implementing your own error handling logic here
      console.error(error);
      alert(error.message);
    }
  }
  function initializeArrows(dataRes) { //gör en metod så att vi får lite mer coherent vad grejerna gör
    setTextInput("");
    //setAmountInput("");
    //setQAPairs(dataRes);
    setCorrectAnswers(0);
    setAnsweredQuestions(0);
    initializeAnswered();

    console.log(dataRes);

    setIndexQ(0);
    setCurrentQuestion(dataRes[0].question);
    setCurrentAnswer(dataRes[0].answer);
    setShownText(dataRes[0].question);
    setLast(false);
    setFirst(true);
  }

  function initializeAnswered(){
    const unAnswered = new Array(amountInput).fill('unanswered');
    setRWAnswers(unAnswered);
  }

  function showNext() {
    if (indexQ + 1 < qaPairs.length) {
      setShownText(qaPairs[indexQ + 1].question);
      setCurrentQuestion(qaPairs[indexQ + 1].question);
      setCurrentAnswer(qaPairs[indexQ + 1].answer);
      removeFlip();
      if (indexQ + 1 == qaPairs.length - 1) {
        setLast(true);
      }
      resetButtons(indexQ+1);
      setIndexQ(indexQ + 1);
      setFirst(false);
    }
  }

  function removeFlip(){
    const flashcard = document.getElementById('flashcard');
      if(flashcard.classList.contains(styles.flipping)){
        flashcard.classList.remove(styles.flipping);
      }
  }


  function showPrevious() {
    if (indexQ - 1 >= 0) {
      setShownText(qaPairs[indexQ - 1].question);
      setCurrentQuestion(qaPairs[indexQ - 1].question);
      setCurrentAnswer(qaPairs[indexQ - 1].answer);
      removeFlip();
      if (indexQ - 1 == 0) {
        setFirst(true);
      }
      resetButtons(indexQ-1);
      setIndexQ(indexQ - 1);
      setLast(false);
    }
  }

  function resetButtons(index){
    if(rwAnswers[index]=='right'){
      document.getElementById('greenButt').classList.add(styles.pressed);
      document.getElementById('redButt').classList.remove(styles.pressed);
    }
    else if(rwAnswers[index]=='wrong'){
      document.getElementById('redButt').classList.add(styles.pressed);
      document.getElementById('greenButt').classList.remove(styles.pressed);
    }
    else{
      document.getElementById('greenButt').classList.remove(styles.pressed);
      document.getElementById('redButt').classList.remove(styles.pressed);
    }
  }

  function handleBoxSize() {
    var myBox = document.getElementById("thetextbox");
    myBox.style.height = "auto";
  }

  function calcRightAnswers(){
    let sum = 0;
    for (let i = 0; i < rwAnswers.length; i++){
      if (rwAnswers[i]=='right'){sum = sum + 1;}
    }
    console.log('calcRightAnswers:', sum);
    setCorrectAnswers(sum);
  }
  function calcAnswered(){
    let sum = 0;
    for (let i = 0; i < rwAnswers.length; i++){
      if (rwAnswers[i]=='right' || rwAnswers[i]=='wrong'){sum+=1;}
    }
    console.log('calcAnswered:', sum);
    setAnsweredQuestions(sum);
  }

  function pressGButton(){
    const button = document.getElementById('greenButt');
    button.classList.add(styles.pressed);
    rwAnswers[indexQ] = 'right';
    console.log(rwAnswers);
    const unpress = document.getElementById('redButt');
    unpress.classList.remove(styles.pressed);
    calcRightAnswers();
    calcAnswered();
  }

  function pressRButton(){
    const button = document.getElementById('redButt');
    button.classList.add(styles.pressed);
    rwAnswers[indexQ] = 'wrong';
    console.log(rwAnswers);
    const unpress = document.getElementById('greenButt');
    unpress.classList.remove(styles.pressed);

    calcRightAnswers();
    calcAnswered();
  }

  function handleFlip(){
    const flashcard = document.getElementById('flashcard');
    if(flashcard.classList.contains(styles.flipping)){
      flashcard.classList.remove(styles.flipping);
    }
    else{
      flashcard.classList.add(styles.flipping);
    }
    flashcard.classList.toggle(styles.showback);
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
                id="thetextbox"
                class="text-input"
                type="text"
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

            <input type="submit" class="submitButton" value="Generate questions" onClick={handleBoxSize}/>

          </form>
        </div>

        <div className={styles.result2}>
          <div className={styles.containerLeftArrow}>
            {!first && <button className={styles.buttonleft} onClick={() => showPrevious()}> </button>}
          </div>

          <div class={styles.flashcard} onClick={handleFlip} id='flashcard'>
            <div class={styles.front} id='back'>{currentQuestion}</div>
            <div class={styles.back} id='front'>{currentAnswer}</div>
          </div>

          <div className={styles.containerRightArrow}>
            {!last && <button className={styles.buttonright} onClick={() => showNext()}></button>}
          </div>
        </div>
          
        <div class={styles.buttons}>
          <button class={styles.green} id="greenButt" onClick={pressGButton}>KNOW IT WELL</button>
          <button class={styles.red} id="redButt" onClick={pressRButton}>DON'T KNOW IT</button>
        </div>
        <div>Correct answers: {correctAnswers}/{answeredQuestions} </div>
        <div>{Math.round(correctAnswers/answeredQuestions*100)}%</div>

      </main>
    </div>
  );
}




