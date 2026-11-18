import tkinter as tk

def greet():
    name = entry.get()
    label_result.config(text=f"Hello, {name}!")

# 1. Create main window
root = tk.Tk()
root.title("Greeting App")
root.geometry("300x150")

# 2. Add input box, button, and output label
entry = tk.Entry(root)
entry.pack(pady=10)

button = tk.Button(root, text="Click Me", command=greet)
button.pack(pady=5)

label_result = tk.Label(root, text="")
label_result.pack(pady=5)

# 3. Run the window
root.mainloop()