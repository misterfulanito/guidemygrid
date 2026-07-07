# Verifying Your Download

Every GuideMyGrid release includes a `SHA256SUMS.txt` file alongside the `.ccx` installer. Checking your download against it lets you confirm the file wasn't corrupted or altered before it reached you.

> **What this proves — and what it doesn't:** A matching checksum proves the file you downloaded is byte-for-byte identical to what was published — it wasn't corrupted in transit and wasn't tampered with after upload. It does **not** cryptographically prove the file came from the developer (that requires code signing, which GuideMyGrid doesn't use yet — planned for a future version). Think of it as "nothing broke or changed on the way," not "this is authentic."

---

## macOS

1. Download both the `.ccx` file and `SHA256SUMS.txt` from the same **[Release](https://github.com/misterfulanito/guidemygrid/releases/latest)** into the same folder (usually **Downloads**).
2. Open **Terminal**.
3. Go to the folder where you saved the files. For example, if they're in Downloads:
   ```bash
   cd ~/Downloads
   ```
4. Run:
   ```bash
   shasum -a 256 -c SHA256SUMS.txt
   ```
5. You should see:
   ```
   GuideMyGrid-vX.Y.Z.ccx: OK
   ```
   `OK` means the file matches what was published. If you see `FAILED` instead, do not install the file — re-download it from the Releases page.

---

## Windows

1. Download both the `.ccx` file and `SHA256SUMS.txt` from the same **[Release](https://github.com/misterfulanito/guidemygrid/releases/latest)** into the same folder (usually **Downloads**).

### Option A — Command Prompt (`certutil`, no setup required)

2. Open **Command Prompt**.
3. Go to the folder where you saved the files. For example:
   ```cmd
   cd %USERPROFILE%\Downloads
   ```
4. Run (replace `X.Y.Z` with the version you downloaded):
   ```cmd
   certutil -hashfile GuideMyGrid-vX.Y.Z.ccx SHA256
   ```
5. `certutil` prints the hash split into pairs of characters with spaces between them, like `e3 b0 c4 42 ...`. **Ignore those spaces** — they're just a display quirk. Compare the letters and numbers, in order, against the matching line in `SHA256SUMS.txt` (opened in Notepad or any text editor). If every character matches, the file is good.

### Option B — PowerShell (`Get-FileHash`, exact-match alternative)

If you'd rather compare two strings directly with no spaces to ignore, use PowerShell instead:

2. Open **PowerShell**.
3. Go to the folder where you saved the files:
   ```powershell
   cd $env:USERPROFILE\Downloads
   ```
4. Run:
   ```powershell
   Get-FileHash -Algorithm SHA256 GuideMyGrid-vX.Y.Z.ccx
   ```
5. Compare the `Hash` value it prints directly against the matching line in `SHA256SUMS.txt` — it should be an exact match, character for character.

---

## Something doesn't match?

If the checksum doesn't match, don't install the file. Delete it, re-download it from the official **[Releases](https://github.com/misterfulanito/guidemygrid/releases/latest)** page, and check again. If it still doesn't match, please open an [Issue](https://github.com/misterfulanito/guidemygrid/issues).
