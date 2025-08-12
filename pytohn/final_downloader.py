import pandas as pd
import requests
from datetime import datetime
import os
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import threading
import sys

# 콘솔 출력 방지 (exe 빌드 시 터미널 숨김)
if getattr(sys, 'frozen', False):
    # exe로 빌드된 경우
    import os
    import sys
    # 표준 출력과 표준 오류를 null로 리다이렉트
    sys.stdout = open(os.devnull, 'w')
    sys.stderr = open(os.devnull, 'w')

class FinalDownloader:
    def __init__(self, root):
        self.root = root
        self.root.title("🏥 산후조리원 데이터 다운로더")
        self.root.geometry("600x500")
        self.root.resizable(True, True)
        
        # 창 아이콘 설정 (있는 경우)
        try:
            self.root.iconbitmap('icon.ico')
        except:
            pass
        
        # 배경색 설정
        self.root.configure(bg='#f0f8ff')
        
        # 서버 URL (전체 공유)
        self.sheet_url = "https://docs.google.com/spreadsheets/d/1M2BURxZ3erydcKwMJcNERUOEyg7EprJoU8r4-brcRoI/edit?gid=589888806#gid=589888806"
        
        self.setup_ui()
        
    def setup_ui(self):
        """UI 구성"""
        # 메인 프레임
        main_frame = ttk.Frame(self.root, padding="25")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # 스타일 설정
        style = ttk.Style()
        style.theme_use('clam')  # 더 모던한 테마 사용
        
        # 커스텀 스타일 정의
        style.configure("Title.TLabel", 
                       font=("맑은 고딕", 20, "bold"), 
                       foreground="#2c3e50",
                       background="#f0f8ff")
        
        style.configure("Subtitle.TLabel", 
                       font=("맑은 고딕", 12), 
                       foreground="#27ae60",
                       background="#f0f8ff")
        
        style.configure("Desc.TLabel", 
                       font=("맑은 고딕", 11), 
                       foreground="#34495e",
                       background="#f0f8ff")
        
        style.configure("Status.TLabel", 
                       font=("맑은 고딕", 10), 
                       foreground="#7f8c8d",
                       background="#f0f8ff")
        
        style.configure("Accent.TButton", 
                       font=("맑은 고딕", 12, "bold"),
                       background="#3498db",
                       foreground="white")
        
        style.configure("Success.TButton", 
                       font=("맑은 고딕", 12, "bold"),
                       background="#27ae60")
        
        style.configure("Frame.TFrame", 
                       background="#f0f8ff")
        
        style.configure("TitleFrame.TLabelframe", 
                       font=("맑은 고딕", 11, "bold"),
                       background="#f0f8ff")
        
        style.configure("TitleFrame.TLabelframe.Label", 
                       font=("맑은 고딕", 11, "bold"),
                       foreground="#2c3e50",
                       background="#f0f8ff")
        
        # 제목 프레임
        title_frame = ttk.Frame(main_frame, style="Frame.TFrame")
        title_frame.pack(fill=tk.X, pady=(0, 20))
        
        # 제목
        title_label = ttk.Label(title_frame, 
                               text="🏥 산후조리원 데이터 다운로더", 
                               style="Title.TLabel")
        title_label.pack()
        
        # 부제목
        subtitle_label = ttk.Label(title_frame, 
                                  text="(서버 연동 버전 - 안전한 데이터 전송)", 
                                  style="Subtitle.TLabel")
        subtitle_label.pack(pady=(5, 0))
        
        # 설명
        desc_label = ttk.Label(title_frame, 
                              text="서버에서 Orders 데이터를 안전하게\n엑셀 파일로 다운로드합니다", 
                              style="Desc.TLabel",
                              justify=tk.CENTER)
        desc_label.pack(pady=(15, 0))
        
        # 저장 폴더 선택
        path_frame = ttk.LabelFrame(main_frame, 
                                   text="📁 저장할 폴더 선택", 
                                   padding="20",
                                   style="TitleFrame.TLabelframe")
        path_frame.pack(fill=tk.X, pady=(0, 25))
        
        self.path_var = tk.StringVar(value="저장할 폴더를 선택해주세요")
        path_label = ttk.Label(path_frame, 
                              textvariable=self.path_var, 
                              wraplength=500, 
                              style="Desc.TLabel")
        path_label.pack(pady=(0, 15))
        
        path_button = ttk.Button(path_frame, 
                                text="📂 폴더 선택하기", 
                                command=self.select_download_path, 
                                style="Accent.TButton")
        path_button.pack()
        
        # 다운로드 버튼
        button_frame = ttk.Frame(main_frame, style="Frame.TFrame")
        button_frame.pack(pady=20)
        
        self.download_button = ttk.Button(button_frame, 
                                         text="📥 데이터 다운로드 시작", 
                                         command=self.start_download, 
                                         style="Success.TButton")
        self.download_button.pack()
        
        # 상태 표시
        status_frame = ttk.LabelFrame(main_frame, 
                                     text="📊 진행 상황", 
                                     padding="15",
                                     style="TitleFrame.TLabelframe")
        status_frame.pack(fill=tk.X, pady=(10, 0))
        
        self.status_var = tk.StringVar(value="대기 중...")
        self.status_label = ttk.Label(status_frame, 
                                     textvariable=self.status_var, 
                                     style="Status.TLabel")
        self.status_label.pack()
        
        # 하단 정보
        info_frame = ttk.Frame(main_frame, style="Frame.TFrame")
        info_frame.pack(fill=tk.X, pady=(20, 0))
        
        info_label = ttk.Label(info_frame, 
                              text="🔒 보안 연결 | 📊 실시간 데이터 | 💾 안전한 저장", 
                              style="Status.TLabel")
        info_label.pack()
        
    def select_download_path(self):
        """다운로드 경로 선택"""
        path = filedialog.askdirectory(title="저장할 폴더 선택")
        if path:
            self.download_path = path
            self.path_var.set(f"✅ 선택됨: {path}")
            
    def update_status(self, message):
        """상태 메시지 업데이트"""
        self.status_var.set(message)
        self.root.update_idletasks()
        
    def start_download(self):
        """다운로드 시작"""
        # 필수 항목 확인
        if not hasattr(self, 'download_path'):
            messagebox.showerror("오류", "저장할 폴더를 선택해주세요!")
            return
            
        # 버튼 비활성화
        self.download_button.config(state='disabled')
        self.update_status("🔄 다운로드 시작...")
        
        def download_thread():
            try:
                # 서버에서 CSV 다운로드
                self.update_status("🌐 서버에서 데이터를 가져오는 중...")
                
                # URL을 CSV 다운로드 형식으로 변환
                csv_url = self.sheet_url.replace('/edit?gid=', '/export?format=csv&gid=')
                csv_url = csv_url.replace('#gid=', '&gid=')
                
                # CSV 데이터 다운로드 (한글 인코딩 처리)
                response = requests.get(csv_url)
                response.raise_for_status()  # 오류 체크
                
                # 한글 인코딩 처리
                response.encoding = 'utf-8'
                
                # CSV 데이터를 DataFrame으로 변환
                from io import StringIO
                csv_data = StringIO(response.text)
                df = pd.read_csv(csv_data, encoding='utf-8')
                
                if df.empty:
                    messagebox.showwarning("경고", "서버에 데이터가 없습니다.")
                    return
                
                # 파일명 생성
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"산후조리원_주문데이터_{timestamp}.xlsx"
                filepath = os.path.join(self.download_path, filename)
                
                # 엑셀 파일로 저장 (한글 인코딩 처리)
                self.update_status("💾 엑셀 파일로 저장 중...")
                
                # ExcelWriter를 사용하여 한글 인코딩 문제 해결
                with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
                    df.to_excel(writer, index=False, sheet_name='Orders')
                    
                    # 워크시트 가져오기
                    worksheet = writer.sheets['Orders']
                    
                    # 열 너비 자동 조정
                    for column in worksheet.columns:
                        max_length = 0
                        column_letter = column[0].column_letter
                        for cell in column:
                            try:
                                if len(str(cell.value)) > max_length:
                                    max_length = len(str(cell.value))
                            except:
                                pass
                        adjusted_width = min(max_length + 2, 50)
                        worksheet.column_dimensions[column_letter].width = adjusted_width
                
                # 완료 메시지
                self.update_status("✅ 다운로드 완료!")
                messagebox.showinfo("🎉 완료", 
                    f"데이터 다운로드가 완료되었습니다!\n\n"
                    f"📄 파일: {filename}\n"
                    f"📁 위치: {self.download_path}\n"
                    f"📊 데이터 행 수: {len(df)}개")
                
            except Exception as e:
                error_msg = f"❌ 다운로드 실패: {str(e)}"
                self.update_status(error_msg)
                messagebox.showerror("오류", 
                    f"다운로드 중 오류가 발생했습니다:\n{str(e)}\n\n"
                    f"서버 연결 상태를 확인해주세요.")
            finally:
                self.download_button.config(state='normal')
                
        threading.Thread(target=download_thread, daemon=True).start()

def main():
    """메인 함수"""
    # 필요한 라이브러리 확인
    missing_libs = []
    try:
        import pandas
    except ImportError:
        missing_libs.append("pandas")
    
    try:
        import requests
    except ImportError:
        missing_libs.append("requests")
    
    try:
        import openpyxl
    except ImportError:
        missing_libs.append("openpyxl")
    
    try:
        import tkinter
    except ImportError:
        missing_libs.append("tkinter")
    
    if missing_libs:
        # GUI가 없는 경우를 대비해 messagebox 대신 기본 오류 처리
        try:
            root = tk.Tk()
            root.withdraw()  # 메인 창 숨기기
            messagebox.showerror("라이브러리 오류", 
                f"❌ 필요한 라이브러리가 설치되지 않았습니다!\n\n"
                f"📦 다음 명령어로 설치해주세요:\n"
                f"pip install {' '.join(missing_libs)}")
            root.destroy()
        except:
            # GUI도 사용할 수 없는 경우
            pass
        return
    
    # GUI 실행
    root = tk.Tk()
    app = FinalDownloader(root)
    root.mainloop()

if __name__ == "__main__":
    main()
