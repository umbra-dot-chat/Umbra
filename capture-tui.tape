Output "./tui-capture.gif"

Set Shell "zsh"
Set Theme "Catppuccin Mocha"
Set FontFamily "JetBrainsMono Nerd Font"
Set FontSize 13
Set Width 800
Set Height 500
Set Padding 0
Set LetterSpacing 0

Type "./packages/umbra-cli/target/debug/umbra"
Enter

Sleep 4s

# Press Enter to open conversation with MattMat (sidebar is already focused)
Enter

Sleep 3s

Screenshot "./tui-screenshot.png"
