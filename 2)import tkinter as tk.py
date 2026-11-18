import tkinter as tk
from tkinter import messagebox

root = tk.Tk()
root.geometry("300x200")

# 1. showinfo - For Information
def info():
    messagebox.showinfo("Info", "File Saved")

# 2. showwarning - For Warning
def warn():
    messagebox.showwarning("Warning", "Low Memory")

# 3. showerror - For Error
def error():
    messagebox.showerror("Error", "File Not Found")

# 4. askquestion / askyesno - For Yes/No question
def ask():
    ans = messagebox.askyesno("Confirm", "Do you want to exit?")
    print(ans) # True for Yes, False for No

tk.Button(root, text="Info", command=info).pack()
tk.Button(root, text="Warning", command=warn).pack()
tk.Button(root, text="Error", command=error).pack()
tk.Button(root, text="Ask Yes/No", command=ask).pack()

root.mainloop()