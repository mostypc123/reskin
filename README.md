<p align="center">
  <img src="https://raw.githubusercontent.com/iamnotmega/reskin/main/public/assets/splash.svg" alt="Splash" width="600"/>
</p>

Reskin is a modern Linux desktop theming app for browsing, applying, and managing custom themes. It supports portable `.reskin` theme packages and provides a simple GUI for theme management across different desktop environments.

## How To Use

### Bundling themes
1. On the left side of the screen, **hover over the semi-visible colored buttons** to reveal the side navigation.
2. Find the **Theme Bundler** button and click on it to open the theme bundler.
3. Fill in the fields and then **click on the theme folder selection area to select a folder** with all of your theme files.
4. Press the **Bundle Theme** button to bundle the theme. You can find your bundled theme at /tmp/reskin.

### Installing themes
1. On the left side of the screen, **hover over the semi-visible colored buttons** to reveal the side navigation.
2. Find the **Theme Installer** button and click on it to open the theme installer.
3. Click the .reskin file selection area and **select your .reskin file to install it.**
4. Hover over the side navigation and choose the **Home** button.
5. Find your recently installed theme in the Recently Viewed section and **click on it**.
6. Once on the theme's page, **press the Apply Theme button to apply the theme**.

## Installation

### Pre-built binary

1. Download the `reskin` binary from the releases page.
2. Make the binary executable:
   ```bash
   chmod +x reskin
   ```
3. Run the app:
   ```bash
   ./reskin
   ```
### Manual installation
> **⚠️** Before compiling from source, please make sure your computer has `cargo` and `npm` installed.

1. Clone the repository:
   ```bash
   git clone https://github.com/iamnotmega/reskin.git
   ```
2. Change to the cloned repository:
   ```bash
   cd reskin
   ```
3. Change to the `src-tauri` directory within the cloned repository folder:
   ```bash
   cd src-tauri
   ```
5. Install the Node modules:
   ```bash
   npm install
   ```
6. Build the app for production:
   ```bash
   npm build
   ```
7. Compile the release binary with `cargo`:
    ```bash
    cargo build --release
    ```
8. Change to the directory with the built binary:
   ```bash
   cd target/release
   ```
9. Run the app:
   ```bash
   ./reskin
   ```

Alternatively, you can also run `cargo run` within the `src-tauri` directory to run the Reskin app directly.
