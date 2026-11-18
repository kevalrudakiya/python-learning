import time
import platform
import subprocess
import pywifi
from pywifi import const
import customtkinter as ctk

ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("green")

class AirflowScannerDashboard(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Wireless Radio Frequency Diagnostics Panel")
        self.geometry("850://580")
        self.resizable(False, False)

        self.wifi_controller = pywifi.PyWiFi()
        try:
            self.network_interface = self.wifi_controller.interfaces()[0]
        except Exception:
            self.network_interface = None

        self.selected_ssid = ""

        # ---- Top Header ----
        self.header = ctk.CTkLabel(
            self, 
            text="LIVE AIRFLOW SPECTRUM MONITOR", 
            font=ctk.CTkFont(family="Consolas", size=18, weight="bold"),
            text_color="#39FF14"
        )
        self.header.pack(pady=(15, 5))

        # ---- Scan Button ----
        self.scan_btn = ctk.CTkButton(
            self,
            text="[ START SPECTRUM SCAN ]",
            font=ctk.CTkFont(family="Segoe UI", size=13, weight="bold"),
            fg_color="#1b4d22",
            hover_color="#2e7d32",
            text_color="#39FF14",
            corner_radius=6,
            width=200,
            command=self.scan_nearby_wifi
        )
        self.scan_btn.pack(pady=10)

        # ---- Main Container ----
        self.main_container = ctk.CTkFrame(self, fg_color="transparent")
        self.main_container.pack(padx=20, pady=10, fill="both", expand=True)

        # Left Side: Network List
        self.left_pane = ctk.CTkFrame(self.main_container, fg_color="#101010", border_color="#1b4d22", border_width=1)
        self.left_pane.pack(side="left", fill="both", expand=True, padx=(0, 10))

        self.menu_title = ctk.CTkLabel(self.left_pane, text="DISCOVERED ACCESS POINTS", font=ctk.CTkFont(weight="bold"), text_color="#888888")
        self.menu_title.pack(pady=5)

        self.scroll_container = ctk.CTkScrollableFrame(self.left_pane, fg_color="#050505")
        self.scroll_container.pack(fill="both", expand=True, padx=5, pady=5)

        # Right Side: Logs & Connection Panel
        self.right_pane = ctk.CTkFrame(self.main_container, fg_color="#0a0a0a", border_color="#1b4d22", border_width=1)
        self.right_pane.pack(side="right", fill="both", expand=True, padx=(10, 0))

        self.info_title = ctk.CTkLabel(self.right_pane, text="METADATA & CONNECTION PANEL", font=ctk.CTkFont(weight="bold"), text_color="#888888")
        self.info_title.pack(pady=5)

        self.log_area = ctk.CTkTextbox(self.right_pane, font=ctk.CTkFont(family="Consolas", size=12), fg_color="#000000", text_color="#39FF14", height=200)
        self.log_area.pack(fill="x", padx=5, pady=5)

        # Input box for entering password manually
        self.pass_entry = ctk.CTkEntry(self.right_pane, placeholder_text="Enter Wi-Fi Password to Connect...", fg_color="#000000", text_color="#39FF14", border_color="#1b4d22")
        self.pass_entry.pack(fill="x", padx=5, pady=10)

        self.connect_btn = ctk.CTkButton(
            self.right_pane,
            text="Connect to Selected Network",
            fg_color="#1b4d22",
            hover_color="#2e7d32",
            text_color="#39FF14",
            command=self.connect_to_selected
        )
        self.connect_btn.pack(fill="x", padx=5, pady=5)

        self.log_area.insert("0.0", "[System Message]: Panel ready.\nClick 'START SPECTRUM SCAN' to find networks.")
        self.log_area.configure(state="disabled")

    def parse_security_type(self, akm_list):
        if not akm_list:
            return "OPEN"
        for akm in akm_list:
            if akm in [const.AKM_TYPE_WPA2, const.AKM_TYPE_WPA2PSK]:
                return "WPA2 Personal"
        return "WPA/Other"

    def get_saved_profile_password(self, ssid_name):
        if platform.system() != "Windows":
            return "[Windows Only]"
        try:
            results = subprocess.check_output(['netsh', 'wlan', 'show', 'profile', ssid_name, 'key=clear'], subprocess.CREATE_NO_WINDOW).decode('utf-8', errors="ignore")
            for line in results.split('\n'):
                if "Key Content" in line:
                    parts = line.split(":")
                    if len(parts) > 1:
                        return parts[1].strip()
            return "[Unsaved Network]"
        except Exception:
            return "[Unsaved Network]"

    def scan_nearby_wifi(self):
        self.log_area.configure(state="normal")
        self.log_area.delete("0.0", "end")
        for widget in self.scroll_container.winfo_children():
            widget.destroy()

        if not self.network_interface:
            self.log_area.insert("end", "[ERROR]: Wireless hardware interface not found.")
            self.log_area.configure(state="disabled")
            return

        self.log_area.insert("end", "[*] Scanning active frequencies... Please wait.\n")
        self.update()

        self.network_interface.scan()
        time.sleep(2.5)
        scan_results = self.network_interface.scan_results()

        unique_networks = {}
        for network in scan_results:
            if network.ssid.strip() and network.ssid not in unique_networks:
                unique_networks[network.ssid] = network

        for net in unique_networks.values():
            net_btn = ctk.CTkButton(
                self.scroll_container,
                text=f"📡 {net.ssid}",
                anchor="w",
                fg_color="#151515",
                hover_color="#1b4d22",
                command=lambda n=net: self.display_network_metadata(n)
            )
            net_btn.pack(fill="x", pady=2, padx=5)

        self.log_area.insert("end", f"[+] Found {len(unique_networks)} networks. Select one from the list.")
        self.log_area.configure(state="disabled")

    def display_network_metadata(self, network):
        self.selected_ssid = network.ssid
        self.log_area.configure(state="normal")
        self.log_area.delete("0.0", "end")

        security_string = self.parse_security_type(network.akm)
        saved_password = self.get_saved_profile_password(network.ssid)
        
        self.log_area.insert("end", f"SSID Name      : {network.ssid}\n")
        self.log_area.insert("end", f"Mac Address    : {network.bssid}\n")
        self.log_area.insert("end", f"Signal         : {network.signal} dBm\n")
        self.log_area.insert("end", f"Security Mode  : {security_string}\n")
        self.log_area.insert("end", f"Saved Profile  : {saved_password}\n")
        self.log_area.configure(state="disabled")

    def connect_to_selected(self):
        if not self.selected_ssid:
            return
        password = self.pass_entry.get()
        self.log_area.configure(state="normal")
        self.log_area.insert("end", f"\n[*] Attempting connection to {self.selected_ssid}...\n")
        
        profile = pywifi.Profile()
        profile.ssid = self.selected_ssid
        profile.auth = const.AUTH_ALG_OPEN
        profile.akm.append(const.AKM_TYPE_WPA2PSK)
        profile.cipher = const.CIPHER_TYPE_CCMP
        profile.key = password

        self.network_interface.disconnect()
        time.sleep(1)
        self.network_interface.remove_all_network_profiles()
        tmp_profile = self.network_interface.add_network_profile(profile)
        self.network_interface.connect(tmp_profile)
        self.log_area.configure(state="disabled")

if __name__ == "__main__":
    app = AirflowScannerDashboard()
    app.mainloop()
