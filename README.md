# Discord Game Bot

This is a Discord bot game where users select their favorite songs in a series of rounds. The bot fetches random songs from a YouTube playlist and presents users with two song options. The player must react to keep their preferred song, continuing until a single winner remains. The game is designed to be fun, dynamic, and replayable.

## Setup Instructions

### Prerequisites

To run the bot, ensure you have the following:

- Node.js (v16.x or later)
- MongoDB instance
- A Discord bot token
- A YouTube Data API v3 key

### Installation

1. Clone the repository:
    ```bash
    git clone <your-repository-url>
    ```

2. Install the dependencies:
    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory and provide the necessary environment variables:
    ```
    TOKEN=<your-discord-bot-token>
    mongoDBUrl=<your-mongodb-url>
    youtubeKey=<your-youtube-api-key>
    ```
## How to Play

1. Type `!ready` in the Discord server to start a new game.
2. The bot will display two random K-pop songs.
3. React with 🎧 to choose the first song or 🌟 to choose the second song.
4. The game progresses until one song remains, which is crowned the winner.
5. If you want to reset and start a new game, type `!reset`.

