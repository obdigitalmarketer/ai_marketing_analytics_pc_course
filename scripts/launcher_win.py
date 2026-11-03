// scripts/launcher_win.py - Option B lightweight Windows .exe launcher.
// Opens the course app in a native WebView2 window (pywebview),
// then build with PyInstaller:
//   pyinstaller --onefile --windowed --name AIMarketingAnalyticsPro scripts/launcher_win.py
import os, webview

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INDEX = os.path.join(ROOT, "app", "index.html")

if __name__ == "__main__":
    webview.create_window(
        "AI Marketing Analytics Pro",
        url="file:///" + INDEX.replace("\\", "/"),
        width=1440, height=920, min_size=(1080, 700),
    )
    webview.start()
