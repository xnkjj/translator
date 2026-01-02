chrome.contextMenus.removeAll();
chrome.contextMenus.create({
  id: "translate",
  title: "Translate Selected Text",
  contexts: ["selection"],
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "translate" && info.selectionText) {
    handleTranslation(info.selectionText, tab.id);
  }
});

async function handleTranslation(textToTranslate, tabId) {
  const {apiKey, prompt, model} = await new Promise((resolve) => {
    chrome.storage.local.get(["apiKey", "prompt", "model"], (result) => {
      resolve({
        apiKey: result?.apiKey || null,
        prompt: result?.prompt || "將下面的話翻譯成繁體中文，如果原文是中文，則翻譯成英文。如果原文是其他語言，則翻譯成中文。僅輸出翻譯結果，下面是要翻譯的內容：",
        model: result?.model || "gemini-2.5-flash-lite"
      });
    });
  });

  if (!apiKey) {
    messageBox("請先配置 API 密鑰", tabId);
    return;
  }

  const requestUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [{text: prompt}],
      },
      {
        role: "user",
        parts: [{text: textToTranslate}],
      },
    ],
  };

  try {
    messageBox("翻譯中...", tabId);

    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let firstFlag = 1;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((line) => line.trim() !== "");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = JSON.parse(line.substring(6));
          if (data?.candidates || null) {
            const parts = data.candidates[0]?.content?.parts || [];
            let translatedText = "";
            parts.forEach((part) => {
                translatedText += part?.text || "";
            });
            if (firstFlag) {
                messageBox(translatedText, tabId);
                firstFlag = 0;
            } else {
                updateMessageBox(translatedText, tabId);
            }
          }
        }
      }
    }
  } catch (error) {
    messageBox("翻譯請求失敗，請檢查您的網絡或 API 密鑰。 err: "+error.toString(), tabId);
  }
}

function messageBox(message, tabId, isLive = false) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: (msg, live) => {
      let div = document.getElementById("translate-popup");
      if (!div) {
        div = document.createElement("div");
        div.id = "translate-popup";
        div.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(10px);
          color: #333;
          padding: 0;
          border: none;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
          z-index: 999999;
          min-width: 320px;
          max-width: 600px;
          max-height: 80vh;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          overflow: hidden;
          animation: slideInPopup 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
        `;

        const header = document.createElement("div");
        header.style.cssText = `
          padding: 16px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-radius: 16px 16px 0 0;
        `;

        const title = document.createElement("div");
        title.textContent = "翻译结果";
        title.style.cssText = `
          font-weight: 600;
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
        `;
        title.innerHTML = "🌐 翻译结果";

        const closeButton = document.createElement("button");
        closeButton.innerHTML = "✕";
        closeButton.style.cssText = `
          border: none;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 18px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          padding: 0;
          line-height: 1;
        `;
        closeButton.onmouseover = () => {
          closeButton.style.background = "rgba(255, 255, 255, 0.3)";
          closeButton.style.transform = "scale(1.1)";
        };
        closeButton.onmouseout = () => {
          closeButton.style.background = "rgba(255, 255, 255, 0.2)";
          closeButton.style.transform = "scale(1)";
        };
        closeButton.onclick = () => {
          div.style.animation = "slideOutPopup 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
          setTimeout(() => div.remove(), 300);
        };

        header.appendChild(title);
        header.appendChild(closeButton);
        div.appendChild(header);

        const text = document.createElement("div");
        text.id = "translate-popup-text";
        text.style.cssText = `
          margin: 0;
          padding: 20px;
          font-size: 15px;
          line-height: 1.6;
          color: #333;
          overflow-y: auto;
          flex: 1;
          white-space: pre-wrap;
          word-wrap: break-word;
        `;
        div.appendChild(text);

        const style = document.createElement("style");
        style.textContent = `
          @keyframes slideInPopup {
            from {
              transform: translateX(100%) scale(0.9);
              opacity: 0;
            }
            to {
              transform: translateX(0) scale(1);
              opacity: 1;
            }
          }
          @keyframes slideOutPopup {
            from {
              transform: translateX(0) scale(1);
              opacity: 1;
            }
            to {
              transform: translateX(100%) scale(0.9);
              opacity: 0;
            }
          }
          #translate-popup::-webkit-scrollbar {
            width: 6px;
          }
          #translate-popup::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
          }
          #translate-popup::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 3px;
          }
          #translate-popup::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
          }
        `;
        document.head.appendChild(style);

        document.body.appendChild(div);
      }

      const textElement = document.getElementById("translate-popup-text");
      if (live) {
        textElement.textContent += msg;
      } else {
        textElement.textContent = msg;
      }
    },
    args: [message, isLive],
  });
}

function updateMessageBox(partialMessage, tabId) {
  messageBox(partialMessage, tabId, true);
}
