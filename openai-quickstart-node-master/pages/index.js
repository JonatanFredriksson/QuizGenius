import Head from "next/head";
import { useState } from "react";
import styles from "./index.module.css";

export default function Home() {
  const [textInput, setTextInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [qaPairs, setQAPairs] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [indexQ, setIndexQ] = useState();
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [last, setLast] = useState();
  const [first, setFirst] = useState();
  const [shownText, setShownText] = useState();



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
    setAmountInput("");
    //setQAPairs(dataRes);


    console.log(dataRes);

    setIndexQ(0);
    setCurrentQuestion(dataRes[0].question);
    setCurrentAnswer(dataRes[0].answer);
    setShownText(dataRes[0].question);
    setLast(false);
    setFirst(true);
  }

  function showNext() {
    if (indexQ + 1 < qaPairs.length) {
      setShownText(qaPairs[indexQ + 1].question);
      setCurrentQuestion(qaPairs[indexQ + 1].question);
      setCurrentAnswer(qaPairs[indexQ + 1].answer);
      if (indexQ + 1 == qaPairs.length - 1) {
        setLast(true);
      }
      setIndexQ(indexQ + 1);
      setFirst(false);
    }
  }

  function showPrevious() {
    if (indexQ - 1 >= 0) {
      setShownText(qaPairs[indexQ - 1].question);
      setCurrentQuestion(qaPairs[indexQ - 1].question);
      setCurrentAnswer(qaPairs[indexQ - 1].answer);
      if (indexQ - 1 == 0) {
        setFirst(true);
      }
      setIndexQ(indexQ - 1);
      setLast(false);
    }
  }

  function handleBoxSize() {
    var myBox = document.getElementById("thetextbox");
    myBox.style.height = "auto";
  }

  function flipCard(){
      if (shownText == currentQuestion){
        setShownText(currentAnswer);
      }
      else {
        setShownText(currentQuestion);
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

          <div className={styles.questionAndAnswer} onClick={() => flipCard()}>
            {shownText}
          </div>

          <div className={styles.containerRightArrow}>
            {!last && <button className={styles.buttonright} onClick={() => showNext()}></button>}
          </div>

        </div>
      </main>
    </div>
  );
}




