document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("api-key");
  const promptInput = document.getElementById("prompt");
  const modelInput = document.getElementById("model");
  const saveButton = document.getElementById("save-btn");
  const resetButton = document.getElementById("reset-btn");

  chrome.storage.local.get(["apiKey", "prompt", "model"], (data) => {
    apiKeyInput.value = data?.apiKey || "";
    modelInput.value = data?.model || "";
    promptInput.value = data?.prompt || "";
  });

  saveButton.addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim();
    const prompt = promptInput.value;
    const model = modelInput.value.trim();

    if (!apiKey) {
      showNotification("請輸入 API 密鑰！", "error");
      return;
    }

    chrome.storage.local.set({ apiKey, prompt, model }, () => {
      showNotification("保存成功！", "success");
    });
  });

  resetButton.addEventListener("click", () => {
    chrome.storage.local.remove(["apiKey", "prompt", "model"], () => {
      apiKeyInput.value = "";
      promptInput.value = "";
      modelInput.value = "";
      showNotification("重置成功！", "success");
    });
  });

  function showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background: ${type === "success" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#ff4757"};
      color: white;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      font-weight: 500;
      animation: slideInRight 0.3s ease-out;
      font-size: 14px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = "slideOutRight 0.3s ease-out";
      setTimeout(() => notification.remove(), 300);
    }, 2000);

    const style = document.createElement("style");
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
});
