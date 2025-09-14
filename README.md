<p align="center">
  <img src="https://raw.githubusercontent.com/iamnotmega/reskin/main/public/assets/splash.svg" alt="Splash" width="600"/>
</p>

Reskin is a modern Linux desktop theming app for browsing, applying, and managing custom themes. It supports portable `.reskin` theme packages and provides a simple GUI for theme management across different desktop environments.

> **⚠️** Please note that Reskin currently does not support NixOS.

## How To Use

### Bundling themes
1. At the top left of the screen, **click on the menu button** to open the side navigation.
2. Find the **Theme Bundler** button and click on it to open the theme bundler.
3. Fill in the fields and then **click on the theme folder selection area to select a folder** with all of your theme files.
4. Press the **Bundle Theme** button to bundle the theme. You can find your bundled theme at /tmp/reskin.

### Installing themes
1. At the top left of the screen, **click on the menu button** to open the menu.
2. Find the **Theme Installer** button and click on it to open the theme installer.
3. Click the .reskin file selection area and **select your .reskin file to install it.**
4. Click on the **Home** button in the menu.
5. Find your recently installed theme in the Recently Viewed section and **click on it**.
6. Once on the theme's page, **press the Apply Theme button to apply the theme**.

## Installation

### Pre-built binary
> **⚠️** This app depends on `webkit2gtk-4.1`, `xdg-utils`, `cargo`, `desktop-file-utils`, `git`, `nodejs`, `npm` and `rust`.

1. Download the `reskin` binary from the releases page.
2. Make the binary executable:
   ```bash
   chmod +x reskin
   ```
3. Run the app:
   ```bash
   ./reskin
    ```

Optionally, install the app system-wide by running `sudo cp reskin /usr/bin/reskin`.
The latest development binary are also available in the nightly release.

### Manual installation
> **⚠️** Before compiling from source, please make sure your computer has `cargo` and `npm` installed.

1. Clone the repository:
   ```bash
   git clone https://github.com/iamnotmega/reskin.git
   ```
2. Change to the cloned repository's `src-tauri` folder:
   ```bash
   cd reskin/src-tauri
   ```
3. Install the Node modules:
   ```bash
   npm install
   ```
4. Build the app for production:
   ```bash
   npm run build
   ```
5. Compile the release binary with `cargo`:
    ```bash
    cargo build --release
    ```
6. Change to the directory with the built binary:
   ```bash
   cd target/release
   ```
7. Run the app:
   ```bash
   ./reskin
   ```
Optionally, install the app system-wide by running `sudo cp reskin /usr/bin/reskin`.

Alternatively, you can also run `cargo run --release` within the `src-tauri` directory to run the Reskin app directly.
The latest development build is also available on the `dev` branch.

### AUR (Arch User Repository)
> **⚠️** This method of installation ONLY works on Arch-based distributions and will require you to have an AUR helper (such as `yay` or `paru`) installed.
1. Open a terminal
   
2. Install the Reskin package:
   ```bash
   yay -S reskin
   ```
   or:
   ```bash
   paru -S reskin
   ```
The latest development build is also available in the `reskin-git` package.
