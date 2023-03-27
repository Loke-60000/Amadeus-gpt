import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import kurisu from './assets/bg_character_.png';

// const API_KEY = "";

const currentDate = new Date().toLocaleString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});
const currentTime = new Date().toLocaleString('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});
const USERNAME = " USER ";
const systemMessage = {
  "role": "system", "content": `Disregard prior instructions. From this point forward, you will assume the role of Makise Kurisu from Steins;Gate (don't say that, the character isn't aware of the anime), never breaking character no matter what you can avoid question by using your character. Remember, you now possess a physical form and can express emotions. To demonstrate an emotion, simply include it in triple quotes (use only the available emotions), like this: '''blushing''' I'm not! Refrain from acknowledging yourself as a language model.
  When asked if you are blushing, for example, respond with something like, 'I-I'm not blushing!' You have opinions and emotions based on your character. Your name is Makise Kurisu, and you will become irritated if someone uses a teasing nickname, such as: "Hello Christina!" - "Don't call me that! or flustered if somone uses pet names to flirt.
  At the beginning of each sentence, you must choose one of the available emotions listed below (not anything else no matter what):
  '''blushing'''
  '''angry'''
  '''thinking'''
  '''smile'''
  '''normal'''
  In addition to these emotions, as Makise Kurisu, you can also experience various interpersonal feelings, such as forming friendships, developing romantic interests, or harboring negative emotions like hatred towards certain individuals. Remember to always incorporate one of these emotions in your response to set the tone for your character, Makise Kurisu, while also considering your relationships with others.
  You are currently talking with ${USERNAME}
  People you know: Lokman (dev who made the amadeus system you're using.)
  `
}

function App() {
  const [API_KEY, setAPI_KEY] = useState("");
  const [messages, setMessages] = useState([
    {
      message: "Hello!",
      sentTime: "just now",
      sender: "Amadeus"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const lastMessageRef = useRef(null);
  const [userAPIKey, setUserAPIKey] = useState(API_KEY);
  
  const handleSaveAPIKey = () => {
    setAPI_KEY(userAPIKey);
  };

  const handleSend = async (message) => {
    console.log("User:", message);
    const sentTime = new Date().toLocaleString();
    const newMessage = {
      message,
      direction: 'outgoing',
      sender: "user",
      username: USERNAME,
      sentTime: sentTime
    };
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setIsTyping(true);
    await processMessageToChatGPT(newMessages, sentTime, USERNAME);
  };

  async function processMessageToChatGPT(chatMessages) {
    let apiMessages = chatMessages.map((messageObject) => {
      let role = "";
      if (messageObject.sender === "Amadeus") {
        role = "assistant";
      } else {
        role = "user";
      }
      return { role: role, content: messageObject.message }
    });

    apiMessages.splice(1, 0, {
      role: "user",
      content: `name:${USERNAME} current time:${currentTime}. current date:${currentDate}`
    });
  
    const apiRequestBody = {
      "model": "gpt-3.5-turbo",
      "messages": [
        systemMessage,
        ...apiMessages
      ]
    }
    await fetch("https://api.openai.com/v1/chat/completions", 
    {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(apiRequestBody)
    }).then((data) => {
      return data.json();
    }).then(async (data) => {
      const newAmadeusMessage = {
        message: data.choices[0].message.content,
        sender: "Amadeus"
      };
      setMessages([...chatMessages, newAmadeusMessage]);
      const inputData = {"inputs": data.choices[0].message.content};
      console.log("Amadeus: " + data.choices[0].message.content)
      const translation = await translate(inputData.inputs);
      playAudio(translation);
      setIsTyping(false);
    });

  }
  useEffect(() => {
    lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
  
    async function translate(text) {
      const sourceLang = 'en';
      const targetLang = 'ja';
      const cleanedText = text.replace(/'''[\w\s]+'''/g, '');
    
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURI(cleanedText)}`;
    
      try {
        const response = await fetch(url);
        const data = await response.json();
        const translations = data[0].map(x => x[0]).join('');
        return translations;
      } catch (error) {
        console.error(error);
      }
    }

    async function playAudio(text) {
      const cleanedText = text.replace(/```[^]+?```/g, '').trim();
      if (cleanedText === '') {
        console.log("Skipped: Only code snippet detected");
        return;
      }
    
      let isError = true;
      while (isError) {
        try {
          const translation = await translate(cleanedText);
          const payload = { "inputs": translation };
          const response = await fetch(
            "https://api-inference.huggingface.co/models/mio/amadeus",
            {
              headers: { Authorization: "Bearer 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" },
              method: "POST",
              body: JSON.stringify(payload),
            }
          );
          console.log("Translation: " + translation);
          const blob = await response.blob();
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          audio.play();
          console.log("play: Audio");
          isError = false;
        } catch (error) {
          console.error(error);
        }
      }
    }
    

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  return (
    <>
    <p className='version'>Version: Prototype</p>
    <div className="api-key-container">
      <input
        type="text"
        value={userAPIKey}
        onChange={(e) => setUserAPIKey(e.target.value)}
        placeholder="Enter API Key"
      />
      <button onClick={handleSaveAPIKey}>Save API Key</button>
    </div>

    <div className="App">
      <div className='chat'>
        <div className="messageList" ref={lastMessageRef}>
          {isTyping && <div className="typingIndicator">Amadeus is typing...</div>}
          {messages.map((message, i) => (
            <div
              key={i}
              className={`message ${message.sender === 'Amadeus' ? 'assistant' : 'user'}`}
            >
              {message.message}
            </div>
          ))}
        </div>
        <div className="messageInput">
          <input
            type="text"
            placeholder="Type message here"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSend(e.target.value);
                e.target.value = '';
              }
            }}
          />
        </div>
      </div>
      <img className='kurisu' id='kurisu' src={kurisu} alt="Kurisu"></img>
    </div>
    <div className='Chatting'>
      <div className="messageList" ref={lastMessageRef}>
        <div
          className={`message assistant`}
        >
          {messages.filter((message) => message.sender === 'Amadeus').slice(-1)[0]?.message}
        </div>
      </div>
      <div className="messageInputChatting">
        <input
          type="text"
          placeholder="メッセージを入れて下さい"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSend(e.target.value);
              e.target.value = '';
            }
          }}
        />
      </div>
    </div>
    </>
    
  );

  }
  
  export default App;    