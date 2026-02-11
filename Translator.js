// Translator.js
import React, { useState } from 'react'
import './Translator.css'
import languageList from './language.json';

export default function Translator() {
    const [inputFormat, setInputFormat] = useState('en');
    const [outputFormat, setOutputFormat] = useState('hi');
    const [translatedText, setTranslatedText] = useState('');
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');
    const [history, setHistory] = useState([]);

    const charLimit = 4500;
    const placeholders = {
        en: 'Enter text to translate',
        hi: 'अनुवाद के लिए पाठ दर्ज करें',
        es: 'Introduce el texto para traducir',
        fr: 'Saisissez le texte à traduire',
        de: 'Text zum Übersetzen eingeben',
        ar: 'أدخل النص للترجمة',
        zh: '输入要翻译的文本',
        ja: '翻訳するテキストを入力してください',
        ko: '번역할 텍스트를 입력하세요',
        it: 'Inserisci il testo da tradurre',
        pt: 'Digite o texto para traduzir',
        ru: 'Введите текст для перевода'
    };

    const showToast = (message) => {
        setToast(message);
        window.clearTimeout(showToast._t);
        showToast._t = window.setTimeout(() => setToast(''), 2000);
    };

    const handleReverseLanguage = () => {
        const from = inputFormat;
        const to = outputFormat;
        if (from === 'auto') {
            setInputFormat(to);
            setOutputFormat('en');
        } else {
            setInputFormat(to);
            setOutputFormat(from);
        }
        setInputText('');
        setTranslatedText('');
        setError('');
    }

    const handleRemoveInputText = () => {
        setInputText('');
        setTranslatedText('');
        setError('');
    }

    const handleInputChange = (value) => {
        const nextValue = value.slice(0, charLimit);
        setInputText(nextValue);
    };

    const handleCopy = async () => {
        if (!translatedText) return;
        try {
            await navigator.clipboard.writeText(translatedText);
            showToast('Copied to clipboard');
        } catch (e) {
            showToast('Copy failed');
        }
    };

    const handleTranslate = async () => {
        if (!inputText.trim() || !inputFormat || !outputFormat || isLoading) return;

        setIsLoading(true);
        setError('');

        try {
            const langpair = `${inputFormat}|${outputFormat}`;
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(inputText)}&langpair=${encodeURIComponent(langpair)}`;
            const response = await fetch(url);
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Request failed (${response.status}): ${errText}`);
            }
            const data = await response.json();
            const translation = data?.responseData?.translatedText || '';
            const status = data?.responseStatus;
            if (status && status !== 200) {
                const details = data?.responseDetails || 'Translation failed.';
                throw new Error(details);
            }
            setTranslatedText(translation || 'No translation returned.');
            const fromLabel = languageList[inputFormat]?.name || inputFormat;
            const toLabel = languageList[outputFormat]?.name || outputFormat;
            const record = {
                id: Date.now(),
                from: fromLabel,
                to: toLabel,
                input: inputText.trim(),
                output: translation || 'No translation returned.'
            };
            setHistory((prev) => [record, ...prev].slice(0, 5));
        } catch (error) {
            console.log(error);
            setError('Translation failed. Please try again.');
        }
        setIsLoading(false);
    }

    const handleKeyDown = (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            handleTranslate();
        }
    };

    const placeholder = placeholders[inputFormat] || placeholders.en;
    return (
        <div className="app-shell">
            <header className="hero">
                <span className="eyebrow">Lingua Studio</span>
                <h1>Translate in a snap</h1>
                <p className="subtitle">Pick two languages, type your text, and get instant results.</p>
            </header>
            <div className="card">
                <div className="row1">
                    <div className="select-group">
                        <label>From</label>
                        <select value={inputFormat}
                                onChange={(e) => setInputFormat(e.target.value)}>
                            {Object.keys(languageList).map((key, index) => {
                                const language = languageList[key];
                                return (
                                    <option key={index} value={key}>{language.name}</option>
                                );
                            })}
                        </select>
                    </div>
                    <button className="swap" onClick={handleReverseLanguage} type="button" aria-label="Swap languages">
                        <svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z">
                            </path>
                        </svg>
                    </button>
                    <div className="select-group">
                        <label>To</label>
                        <select value={outputFormat} onChange={(e) => {
                            setOutputFormat(e.target.value);
                            setTranslatedText('');
                            setError('');
                        }}>
                            {Object.keys(languageList).map((key, index) => {
                                const language = languageList[key];
                                return (
                                    <option key={index + 118} value={key}>{language.name}</option>
                                );
                            })}
                        </select>
                    </div>
                </div>
                <div className="row2">
                    <div className="inputText">
                        <div className="field-head">
                            <span>Input</span>
                            <button className="ghost" onClick={handleRemoveInputText} type="button" disabled={!inputText.length}>
                                Clear
                            </button>
                        </div>
                        <textarea
                            value={inputText}
                            placeholder={placeholder}
                            onChange={(e) => handleInputChange(e.target.value)}
                            onKeyDown={handleKeyDown} />
                        <div className={`helper ${inputText.length >= charLimit ? 'warning' : ''}`}>
                            {inputText.length}/{charLimit} characters
                        </div>
                    </div>
                    <div className="outputText">
                        <div className="field-head">
                            <span>Output</span>
                            <button className="ghost" type="button" onClick={handleCopy} disabled={!translatedText}>
                                Copy
                            </button>
                        </div>
                        <div className={`outputBox ${translatedText ? '' : 'placeholder'} ${isLoading ? 'loading' : ''}`}>
                            {isLoading ? <span className="skeleton"></span> : null}
                            {!isLoading ? (translatedText || 'Translation will appear here.') : null}
                        </div>
                    </div>
                </div>
                {error ? <div className="error">{error}</div> : null}
                <div className="row3">
                    <button className="btn"
                            onClick={handleTranslate}
                            disabled={isLoading || !inputText.trim()}>
                        {isLoading ? <span className="spinner" aria-hidden="true"></span> : null}
                        <span>{isLoading ? 'Translating...' : 'Translate'}</span>
                    </button>
                </div>
            </div>
            <section className="history">
                <div className="history-head">
                    <h2>Recent translations</h2>
                    <span>Last {history.length} items</span>
                </div>
                <div className="history-grid">
                    {history.length === 0 ? (
                        <div className="history-empty">No translations yet. Try one above.</div>
                    ) : history.map((item) => (
                        <button className="history-card" key={item.id} type="button" onClick={() => {
                            setInputText(item.input);
                            setTranslatedText(item.output);
                        }}>
                            <div className="history-meta">{item.from} → {item.to}</div>
                            <div className="history-input">{item.input}</div>
                            <div className="history-output">{item.output}</div>
                        </button>
                    ))}
                </div>
            </section>
            <footer className="footer">
                <span>Powered by MyMemory Translation API</span>
                <span className="kbd">Ctrl + Enter</span>
            </footer>
            {toast ? <div className="toast">{toast}</div> : null}
        </div>
    )
}
