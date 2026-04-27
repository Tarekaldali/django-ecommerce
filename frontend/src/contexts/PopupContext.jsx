import React, { createContext, useContext, useState } from "react";

const PopupContext = createContext({ showPopup: () => {}, hidePopup: () => {} });

export function PopupProvider({ children }) {
  const [popup, setPopup] = useState({ visible: false, message: "" });

  function showPopup(message) {
    setPopup({ visible: true, message: String(message || "") });
  }

  function hidePopup() {
    setPopup({ visible: false, message: "" });
  }

  return (
    <PopupContext.Provider value={{ showPopup, hidePopup }}>
      {children}
      {popup.visible ? (
        <div className="popup-overlay" onClick={hidePopup}>
          <div className="popup-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="popup-content">{popup.message}</div>
            <div className="popup-actions">
              <button className="button button--primary" onClick={hidePopup} type="button">
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PopupContext.Provider>
  );
}

export function usePopup() {
  return useContext(PopupContext);
}
