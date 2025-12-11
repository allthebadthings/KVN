# Installation Guide: Git and Claude CLI (Windows)

This guide will walk you through installing Git and Claude CLI on your Windows laptop, then cloning the psychic-potato repository.

## Part 1: Installing Git

1. Go to [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. The download should start automatically. If not, click the download link for your system
3. Run the downloaded installer (`.exe` file)
4. Follow the installation wizard:
   - Keep all default settings (just click "Next")
   - Click "Install"
   - Click "Finish" when done
5. Verify installation:
   - Open Command Prompt (search for "cmd" in Start menu)
   - Type: `git --version`
   - You should see the Git version number

## Part 2: Configure Git

After installing Git, you need to set up your identity:

1. Open Command Prompt

2. Set your name:
   ```bash
   git config --global user.name "Your Name"
   ```

3. Set your email:
   ```bash
   git config --global user.email "your.email@example.com"
   ```

## Part 3: Set Up SSH Key for GitHub

To clone the repository, you'll need an SSH key set up with GitHub.

### Generate SSH Key

1. Open Command Prompt

2. Generate a new SSH key:
   ```bash
   ssh-keygen -t ed25519 -C "your.email@example.com"
   ```

3. When prompted "Enter file in which to save the key", press Enter (uses default location)

4. When prompted for a passphrase, you can:
   - Press Enter twice for no passphrase (easier but less secure)
   - Or enter a passphrase (more secure but you'll need to enter it when using the key)

### Add SSH Key to GitHub

1. Copy your SSH public key by running this in Command Prompt:
   ```bash
   type %USERPROFILE%\.ssh\id_ed25519.pub
   ```
   Then manually copy the output (select the text, right-click, and choose Copy)

2. Go to [https://github.com/settings/keys](https://github.com/settings/keys)

3. Click "New SSH key"

4. Give it a title (e.g., "My Laptop")

5. Paste your key into the "Key" field

6. Click "Add SSH key"

### Test SSH Connection

```bash
ssh -T git@github.com
```

You should see a message like: "Hi username! You've successfully authenticated..."

## Part 4: Installing Claude CLI

### Prerequisites

You need Node.js installed. Check if you have it by running:
```bash
node --version
```

If you don't have Node.js, install it first:

#### Installing Node.js

1. Go to [https://nodejs.org](https://nodejs.org)
2. Download the LTS (Long Term Support) version
3. Run the installer and follow the prompts
4. Restart Command Prompt

### Installing Claude CLI

1. Open Command Prompt

2. Install Claude CLI globally using npm:
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

3. Wait for the installation to complete

4. Verify installation:
   ```bash
   claude --version
   ```

## Part 5: Setting Up Claude CLI

### Get Your API Key

1. Go to [https://console.anthropic.com](https://console.anthropic.com)
2. Sign in or create an account
3. Go to "API Keys" section
4. Click "Create Key"
5. Copy your API key (save it somewhere safe!)

### Configure Claude CLI

1. Start Claude CLI:
   ```bash
   claude
   ```

2. On first run, it will ask for your API key
3. Paste your API key when prompted
4. Press Enter

## Part 6: Clone the Repository

Now you're ready to clone the psychic-potato repository!

### Navigate to Where You Want the Project

1. Decide where you want to store the project (e.g., Documents, Desktop, or a projects folder)

2. Navigate there in Command Prompt. For example, to go to your Documents folder:
   ```bash
   cd %USERPROFILE%\Documents
   ```
   Or for Desktop:
   ```bash
   cd %USERPROFILE%\Desktop
   ```

### Clone the Repository

```bash
git clone git@github.com:allthebadthings/psychic-potato.git
```

### Enter the Project Directory

```bash
cd psychic-potato
```

### Success!

You now have the repository cloned on your computer! You can:
- Explore the files: `ls` (macOS/Linux) or `dir` (Windows)
- Start Claude in the project directory: `claude`
- Make changes and commit them with Git

## Part 7: Basic Usage

### Starting Claude in Your Project

Make sure you're in the project directory, then:
```bash
claude
```

### Basic Git Commands

```bash
git status              # See what files have changed
git pull                # Get latest changes from GitHub
git add .               # Stage all changes
git commit -m "message" # Commit with a message
git push                # Push changes to GitHub
```

### Basic Claude Commands

Once Claude is running:
- Ask questions directly
- Request code help
- Use slash commands like `/help`
- Exit by typing `/exit` or pressing Ctrl+C

## Troubleshooting

### "Permission denied (publickey)" error

This means your SSH key isn't set up correctly with GitHub:
1. Make sure you completed Part 3 (SSH Key setup)
2. Verify your key was added to GitHub
3. Test connection: `ssh -T git@github.com`

### "command not found" errors

**If `git` is not found:**
- Windows: Restart Command Prompt after installation
- macOS/Linux: Make sure installation completed successfully

**If `claude` is not found:**
- Make sure npm installation completed without errors
- Try closing and reopening your terminal
- Check if npm global bin is in your PATH

### Permission errors during installation

**Linux/macOS:**
- You might need to use `sudo` for global npm installs
- Or configure npm to install globally without sudo

**Windows:**
- Run Command Prompt as Administrator

## Need More Help?

- Git Documentation: [https://git-scm.com/doc](https://git-scm.com/doc)
- Claude CLI Documentation: [https://github.com/anthropics/claude-code](https://github.com/anthropics/claude-code)
- GitHub SSH Help: [https://docs.github.com/en/authentication/connecting-to-github-with-ssh](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

---

Installation complete! You're ready to work with the psychic-potato repository using Git and Claude CLI.
