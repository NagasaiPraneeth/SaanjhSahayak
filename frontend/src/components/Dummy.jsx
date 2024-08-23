
import { useState, useEffect, useRef } from "react";
import axios from "axios";


import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
export default function CaretakerAnalysis() {

    const [url, setUrl] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [pdfDocument, setPdfDocument] = useState(null);
    const [scale, setScale] = useState(1);
    const canvasRef = useRef(null);
    const popupContentRef = useRef(null);
    const containerRef = useRef(null);
    
  useEffect(() => {
    if (url && isPopupOpen) {
      loadPdf();
    }
  }, [url, isPopupOpen]);

  const loadPdf = async () => {
    if (url) {
      try {
    const loadingTask = pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;
    setPdfDocument(pdf);
    setNumPages(pdf.numPages);
    renderPage(pdf, currentPage);
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    }
  };

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current && isPopupOpen && pdfDocument) {
                updateScale();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isPopupOpen, pdfDocument]);

    const updateScale = async () => {
        if (!pdfDocument || !containerRef.current) return;

        const page = await pdfDocument.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        const widthScale = containerWidth / viewport.width;
        const heightScale = containerHeight / viewport.height;
        const newScale = Math.min(widthScale, heightScale) * 2;

        setScale(newScale);
        renderAllPages(newScale);
    };

    const renderPage = async (pdf, pageNum, canvas, currentScale) => {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: currentScale });
        canvas.height = viewport.height * 2;
        canvas.width = viewport.width * 2;
        const context = canvas.getContext('2d');
        context.scale(2, 2);

        await page.render({
            canvasContext: context,
            viewport: viewport,
            renderInteractiveForms: true,
            canvasFactory: {
                create: function (width, height) {
                    const canvas = document.createElement('canvas');
                    canvas.width = width * 2;
                    canvas.height = height * 2;
                    return canvas;
                },
                reset: function (canvasAndContext, width, height) {
                    canvasAndContext.canvas.width = width * 2;
                    canvasAndContext.canvas.height = height * 2;
                },
                destroy: function (canvasAndContext) {
                    // no-op
                }
            }
        });
    };

    const renderAllPages = async (currentScale) => {
        if (!pdfDocument || !popupContentRef.current) return;

        popupContentRef.current.innerHTML = '';
        for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
            const canvas = document.createElement('canvas');
            canvas.style.width = '100%';
            canvas.style.height = 'auto';
            canvas.style.marginBottom = '10px';
            await renderPage(pdfDocument, pageNum, canvas, currentScale);
            popupContentRef.current.appendChild(canvas);
        }
    };
    const openPopup = async () => {
        setIsPopupOpen(true);
        setTimeout(updateScale, 0);
    };
    const closePopup = () => {
        setIsPopupOpen(false);
        if (popupContentRef.current) {
            popupContentRef.current.innerHTML = '';
        }
    };
    async function getUrl() {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/en/pdfid/${reportData.file}`, { responseType: 'arraybuffer' });
            const binaryData = new Uint8Array(response.data);
            const blob = new Blob([binaryData], { type: 'application/pdf' });
            let url = window.URL.createObjectURL(blob);
            setUrl(url)
        } catch (error) {
            console.error("Error fetching report:", error);
        }
    }
    return (
        {isPopupOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div ref={containerRef} className="bg-white rounded-lg w-3/4 max-w-4xl h-5/6 flex flex-col">
                    <div className="flex justify-between items-center p-4">
                        <h2 className="text-xl font-bold">PDF Viewer</h2>
                        <button
                            onClick={closePopup}
                            className="px-4 py-2 bg-red-500 text-white rounded"
                        >
                            Close
                        </button>
                    </div>
                    <div
                        ref={popupContentRef}
                        className="flex-grow overflow-y-auto scrollbar-hide p-4"
                        style={{
                            msOverflowStyle: 'none',
                            scrollbarWidth: 'none',
                        }}
                    >
                        {/* PDF pages will be rendered here */}
                    </div>
                </div>
            </div>
        )

    )
}
}