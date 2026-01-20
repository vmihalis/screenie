# Screenie Demo - Responsive Screenshot CLI
# Regenerate: npm run demo

Output demo/demo.gif
Require screenie

Set Shell "bash"
Set FontSize 18
Set Width 850
Set Height 450
Set Framerate 12
Set Theme "Catppuccin Mocha"
Set TypingSpeed 50ms
Set WindowBar Colorful

# Hidden setup - navigate to temp directory
Hide
Type "cd /tmp"
Enter
Sleep 500ms
Type "clear"
Enter
Sleep 200ms
Show

# Demo begins - show the screenie command
Type "screenie https://example.com --phones-only"
Sleep 500ms
Enter

# Wait for capture to complete (~5s with phones-only flag)
Sleep 6s

# Final pause to show completion message
Sleep 2s
