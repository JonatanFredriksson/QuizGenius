import Head from "next/head";
import { useEffect, useState, useRef } from "react";
import styles from "./index.module.css";

import localforage from "localforage";

export default function Home() {
  const [textInput, setTextInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [qaPairs, setQAPairs] = useState([]);


  const [showAnswers, setShowAnswers] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [indexQ, setIndexQ] = useState();
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [last, setLast] = useState();
  const [first, setFirst] = useState("");
  const [downloadInProgress, setDownloadInProgress] = useState(false); // Add downloadInProgress state

  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [rwAnswers, setRWAnswers] = useState([]);

  const [multiQuestions, setQuestionMode] = useState(false);

  const [answerShowing, setAnswerShowing] = useState(false);

  let qaPairsRef = useRef([]); // Ref to store updated qaPairs value



  function handleSwitchChange(e) {
    console.log("YOYOYO");
    if (e.target.checked) {
      setAmountInput("1");
      console.log("vi sätter amount till 1");
    } else {
      setAmountInput("");
      console.log("vi sätter inte amount till 1");

    }
  }
  useEffect(() => {
    // Fetch the most recently stored QA pair from local storage
    localforage.getItem("qaPairs").then((storedQAPairs) => {
      if (storedQAPairs) {
        setQAPairs(storedQAPairs);
        qaPairsRef.current = storedQAPairs;
        // Set the initial question and answer to the most recent QA pair
        const firstQAPair = storedQAPairs[0];
        setCurrentQuestion(firstQAPair.question);
        setCurrentAnswer(firstQAPair.answer);
        setIndexQ(0);
        setFirst(true);
      }
    }).catch((error) => {
      // Handle any errors that may occur during fetching
      console.error("Error fetching data from local storage:", error);
    });

    // Add event listener to download button
    const downloadButton = document.getElementById("downloadButton");
    downloadButton.addEventListener("click", downloadFlashcards); // Update to use the downloadFlashcards function




    // Cleanup: remove event listener when component unmounts
    return () => {
      downloadButton.removeEventListener("click", downloadFlashcards);
    };
  }, []);


  async function onSubmit(event) {
    event.preventDefault();
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({ inputText: textInput, amount: amountInput, questionMode: multiQuestions }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      let updatedQaPairs = data.result;
      console.log(updatedQaPairs);
      let multiQuestionsBool = (data.questionMode);
      if (multiQuestionsBool == true) { //vi ska concatenera till våran redan existerande qaPairs innan vi setter nya

        console.log("YIPPI");
        let oldQAPairs = [];
        //let temp = localforage.getItem("qaPairs");
        let temp = await localforage.getItem("qaPairs");

        console.log("INSIDE: " + temp);
        if (temp === null || temp.length === 0) {
          // The qaPairs array is empty or null, vi kan skriva över

          updatedQaPairs = (data.result);
        } else {
          // The qaPairs array has elements, vi adderar den nyaste till den existerande
          //temp.push(data.result);
          updatedQaPairs = temp.concat(data.result);
        }
        console.log("Updated" + updatedQaPairs);

      }



      localforage.setItem("qaPairs", updatedQaPairs);



      qaPairsRef.current = updatedQaPairs;
      //setActiveDownload(true); //does seem to not do anything since it resets

      //setResult(data.result);
      console.log("This is the data: " + updatedQaPairs);
      const formattedResult = (updatedQaPairs); //formateringen måste nu ändras när vi ändrat datastrukturen, vi skippar detta steg, formatterar i generate istället
      setQAPairs(formattedResult); //vi sätter datan i variabeln qaPairs



      console.log("qaPairs: " + qaPairs);
      console.log(formattedResult);



      // qaPairs = gamla
      //data.result = nya


      //window.scrollTo(0, document.body.scrollHeight);
      document.getElementById('flashcard').scrollIntoView({ behavior: 'smooth', block: 'end' });



      //console.log(trimUnfinishedSentences(data.result)); //fungerar inte just nu med arrayen

      if (multiQuestionsBool === true) {
        jumpToTheLast(formattedResult);
      }
      else {
        initializeArrows(formattedResult);

      }
      const downloadButton = document.getElementById("downloadButton");
      /*downloadButton.addEventListener("click", function () {
        downloadFlashcards(formattedResult);
      });
    */

      /*document.getElementById("downloadButton").addEventListener("click", function () { //vi adderar vår egna nedladdningsevent
        console.log("Active event");
        downloadActiveFlashcards(formattedResult);
      }); //
*/
      // Trigger uploadFlashcards() function when a file input changes
      //document.getElementById("uploadInput").addEventListener("change", uploadFlashcards);


    } catch (error) {
      // Consider implementing your own error handling logic here
      console.error(error);
      alert(error.message);
    }
  }




  async function downloadFlashcards() {

    if (downloadInProgress) {
      return; // Return early if download is already in progress
    }
    setDownloadInProgress(true); // Set download in progress flag

    const qaPairsData = await localforage.getItem("qaPairs");
    if (qaPairsData) {
      // Generate JSON file
      const jsonData = JSON.stringify(qaPairsData, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "qaPairs.json";
      link.click();
      URL.revokeObjectURL(url);
    }
    setDownloadInProgress(false); // Set download in progress flag

  }



  // Function to upload and load question and answer pairs from a JSON file
  function uploadFlashcards(event) {
    console.log("uploader");
    var file = event.target.files[0];
    //var file = document.getElementById("fileInput");
    var reader = new FileReader();
    reader.onload = function (e) {
      var flashcards = JSON.parse(e.target.result);
      console.log("Flashcards loaded from file:");
      console.log(flashcards);
      // Use the loaded flashcards as needed, e.g., update your flashcards data structure or render them on the page

      setQAPairs(flashcards);
      initializeArrows(flashcards);
      localforage.setItem("qaPairs", flashcards);

      qaPairsRef.current = flashcards;

    };
    reader.readAsText(file);
    //setQAPairs(event); //säter qaPair till det upladdade
    //initializeArrows(qaPairs);
  }




  function initializeArrows(dataRes) { //gör en metod så att vi får lite mer coherent vad grejerna gör
    setTextInput("");
    setAmountInput("");
    //setQAPairs(dataRes);
    setCorrectAnswers(0); //resetting green button
    setAnsweredQuestions(0);//resetting whole amount of answered question (not answered)
    initializeAnswered(); //resetting data so its all unanswered

    console.log(dataRes);

    setIndexQ(0); //sets it to the first question
    setCurrentQuestion(dataRes[0].question); //sets to first question
    setCurrentAnswer(dataRes[0].answer); //sets to first answer
    console.log("AmountINput:  " + amountInput);
    if (amountInput > 1) { //om vi bara har en så ska arrows inte komma upp, dock måste exception finnas eftersom vi nu har generate question en i taget, så vi har multiquestion boolen som en check, om den är false så är det ett antal frågor och vi gör nytt, 
      setLast(false);

    }

    else { //i detta fall är amount of questions mer än 1 alltså flera, frågor så vi vill bläddra med arrows, eller så är det kanske bara en men den adderas till, så vi vill fortfarande kunnabläddra
      setLast(true);
      console.log("TO");
    }

    //egentligen borde det ändras så att vi sätter set last till true om multiquestionBool är sann
    setFirst(true);
  }

  function initializeAnswered() {
    const unAnswered = new Array(amountInput).fill('unanswered');
    setRWAnswers(unAnswered);
  }


  function jumpToTheLast(dataRes) {


    let newIndex = (dataRes.length - 1);
    setIndexQ(newIndex);
    setCurrentQuestion(dataRes[newIndex].question); //sets to first question
    setCurrentAnswer(dataRes[newIndex].answer); //sets to first answer
    setLast(true);
    setFirst(false);
  }

  function showNext() {
    console.log("Next" + indexQ);

    setAnswerShowing(false);
    if (indexQ + 1 < qaPairs.length) {
      setCurrentQuestion(qaPairs[indexQ + 1].question);
      setCurrentAnswer(qaPairs[indexQ + 1].answer);
      removeFlip();
      if (indexQ + 1 == qaPairs.length - 1) {
        setLast(true);
      }
      resetButtons(indexQ + 1);
      setIndexQ(indexQ + 1);
      setFirst(false);
    }
  }

  function showPrevious() {
    setAnswerShowing(false);

    console.log("Prev" + indexQ);
    if (indexQ - 1 >= 0) {
      setCurrentQuestion(qaPairs[indexQ - 1].question);
      setCurrentAnswer(qaPairs[indexQ - 1].answer);
      removeFlip();
      if (indexQ - 1 == 0) {
        setFirst(true);
      }
      resetButtons(indexQ - 1);
      setIndexQ(indexQ - 1);
      setLast(false);
    }
  }

  function removeFlip() {
    const flashcard = document.getElementById('flashcard');
    if (flashcard.classList.contains(styles.flipping)) {
      flashcard.classList.remove(styles.flipping);
    }
  }

  function resetButtons(index) {
    if (rwAnswers[index] == 'right') {
      document.getElementById('greenButt').classList.add(styles.pressed);
      document.getElementById('redButt').classList.remove(styles.pressed);
    }
    else if (rwAnswers[index] == 'wrong') {
      document.getElementById('redButt').classList.add(styles.pressed);
      document.getElementById('greenButt').classList.remove(styles.pressed);
    }
    else {
      document.getElementById('greenButt').classList.remove(styles.pressed);
      document.getElementById('redButt').classList.remove(styles.pressed);
    }
  }

  function handleBoxSize() {
    var myBox = document.getElementById("thetextbox");
    myBox.style.height = "auto";
  }

  function calcRightAnswers() {
    let sum = 0;
    for (let i = 0; i < rwAnswers.length; i++) {
      if (rwAnswers[i] == 'right') { sum = sum + 1; }
    }
    console.log('calcRightAnswers:', sum);
    setCorrectAnswers(sum);
  }
  function calcAnswered() {
    let sum = 0;
    for (let i = 0; i < rwAnswers.length; i++) {
      if (rwAnswers[i] == 'right' || rwAnswers[i] == 'wrong') { sum += 1; }
    }
    console.log('calcAnswered:', sum);
    setAnsweredQuestions(sum);
  }

  function pressGButton() {
    const button = document.getElementById('greenButt');
    button.classList.add(styles.pressed);
    rwAnswers[indexQ] = 'right';
    console.log(rwAnswers);
    const unpress = document.getElementById('redButt');
    unpress.classList.remove(styles.pressed);
    calcRightAnswers();
    calcAnswered();
  }

  function pressRButton() {
    const button = document.getElementById('redButt');
    button.classList.add(styles.pressed);
    rwAnswers[indexQ] = 'wrong';
    console.log(rwAnswers);
    const unpress = document.getElementById('greenButt');
    unpress.classList.remove(styles.pressed);

    calcRightAnswers();
    calcAnswered();
  }

  function handleFlip() {

    const flashcard = document.getElementById('flashcard');
    if (flashcard.classList.contains(styles.flipping)) {
      flashcard.classList.remove(styles.flipping);
      setAnswerShowing(false);

    }
    else {
      flashcard.classList.add(styles.flipping);
      setAnswerShowing(true);
      console.log("Vi klickar för att revela answer " + answerShowing);

    }
    flashcard.classList.toggle(styles.showback);
  }


  const generateSingleQuestion = () => {
    if (multiQuestions === true) {
      console.log("Vi kör en fråga i taget");
      setAmountInput(1);
    }
    const form = document.getElementById("qaForm");
    console.log(form);
    const event = new Event("submit", { cancelable: true });
    form.dispatchEvent(event);
  };

  return (
    <div className={styles.outerouterContainer}>
      <Head>
        <title>QuizGenius</title>
        <link rel="icon" href="/QuizGenius-Q.png" />
      </Head>


      <main className={styles.main}>
        <div>
          <img src="/QuizGenius-1.png" className={styles.icon} />

        </div>
        <div>
          <h3>Autogenerate quiz questions!</h3>
          <h5>Either write in your own notes to create quiz questions from or simply type in a topic</h5>

        </div>
        <div class="containerForm">
          <form onSubmit={onSubmit} id="qaForm">
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

            <label className={styles.labelForMode}>Switch modes</label>

            <div className={styles.enableFeature}>


              <input
                type="checkbox"
                name="questionMode"
                checked={multiQuestions}
                onChange={(e) => {
                  setQuestionMode(e.target.checked);
                  handleSwitchChange(e); // Pass the event object to the function
                }}
                className={styles.switch}
              />
              <span className={styles.slider}></span>

            </div>
            <input type="submit" className={styles.submitButtonSingle} value="Generate one question" onClick={() => generateSingleQuestion()} style={{ display: multiQuestions ? "inline-block" : "none" }} />


            <div name="numberOfQuestions" className={multiQuestions ? styles.hidden : ""}>
              <input
                type="number"
                name="amount"
                placeholder="Number of questions"
                value={amountInput}
                onChange={(f) => setAmountInput(f.target.value)}
                //min="1.0"
                step="1"
              //required 
              />
            </div>



            <input type="submit" class="submitButton" value="Generate questions" style={{ display: multiQuestions ? "none" : "inline-block" }} />



          </form>
        </div>


        <div className={styles.result2}>
          <div className={styles.containerLeftArrow}>
            {!first && <button className={styles.buttonleft} onClick={() => showPrevious()}> </button>}
          </div>

          <div class={styles.flashcard} onClick={handleFlip} id='flashcard' >
            <div class={styles.front} id='front' style={{ display: answerShowing ? "none" : "inline-block" }}>{currentQuestion} </div>
            <div class={styles.back} id='back' style={{ display: answerShowing ? "inline-block" : "none" }}>{currentAnswer}</div>
          </div>

          <div className={styles.containerRightArrow}>
            {!last && <button className={styles.buttonright} onClick={() => showNext()}></button>}
          </div>
        </div>


        <div class={styles.buttons}>
          <button class={styles.green} id="greenButt" onClick={pressGButton}>KNOW IT WELL</button>
          <button class={styles.red} id="redButt" onClick={pressRButton}>DON'T KNOW IT</button>
        </div>
        <div>
          Correct answers: {correctAnswers}/{answeredQuestions}{" "}
        </div>
        {answeredQuestions === 0 ? (<div>No questions answered yet</div>) : (<div>{Math.round((correctAnswers / answeredQuestions) * 100)}%</div>)}
        <p className={styles.textarea}>Download File</p>

        <button className={styles.downloadUpload} id="downloadButton">
          <img src="/DownloadIconTransparent.png" className={styles.iconDownload} />

        </button>

        <div className={styles.uploadFileButton}>
          <label htmlFor="fileInput" className={styles.customFileInput}>
            Upload File
          </label>
        </div>
        <input className={styles.uploadFileButton}
          id="fileInput"
          type="file"
          accept=".json"
          onChange={uploadFlashcards}
          style={{ display: 'none' }}
        />

      </main>
    </div>
  );
}




