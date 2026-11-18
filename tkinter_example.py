import tkinter as tk

root = tk.Tk()
root.title("Widgets Example")
root.geometry("300x280")

# 1. Label - Shows text on screen
tk.Label(root, text="Name:").pack()

# 2. Entry - Single line input box to type name
tk.Entry(root).pack()

# 3. Button - Clickable button to perform action
tk.Button(root, text="Submit").pack(pady=5)

# 4. Checkbutton - Checkbox for multiple selection
tk.Checkbutton(root, text="I Agree").pack()

# 5. Radiobutton - For selecting only one option
tk.Radiobutton(root, text="Male", value=1).pack()
tk.Radiobutton(root, text="Female", value=2).pack()

# 6. Listbox - Shows list of items
box = tk.Listbox(root, height=3)
box.insert(1, "Python")
box.insert(2, "Java")
box.pack()

root.mainloop()