import dotenv from 'dotenv';
import { Client, EmbedBuilder, AttachmentBuilder} from 'discord.js';
import fetch from 'node-fetch';
import {quotes} from "./quotes.js"
import mongoose from 'mongoose'
dotenv.config();
const client = new Client({
  intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent', 'GuildMessageReactions']
});
const gameSchema = new mongoose.Schema({
  UserId: String,
  gameProgress: Boolean,
  sixteenRandomSongs: [], 
  round: Number,
  pastSongs: []
});
const Game = mongoose.model("KPOPSODO",gameSchema);
const playlistFetchInterval = 7 * 24 * 60 * 60 * 1000;
const file= new AttachmentBuilder('giphy.gif');
const file1 = new AttachmentBuilder('botBackground.jpeg');
const file2 = new AttachmentBuilder('logos.png');
const mongoDBUrl = process.env.mongoDBUrl;
const allGroups = 'PLOHoVaTp8R7dfrJW5pumS0iD_dhlXKv17'
let allGroups1 = [];
const youtubeKey = process.env.youtubeKey;


async function updatePlaylists() {
  try {
    let tempallGroups1 = []
    tempallGroups1 = await getPlaylistsItems(allGroups);
    allGroups1 = await tempallGroups1;
    console.log('Playlists updated successfully.');
  } catch (error) {
    console.error('Error updating playlists:', error);
  }
}

setInterval(updatePlaylists, playlistFetchInterval);
async function createOrUpdateGameState(UserId, gameData) {
  try {
    let game = await Game.findOne({ UserId: await UserId });
    if (!game) {
      game = new Game({ UserId: await UserId, ...await gameData , pastSongs: []});
      await game.save();
    } else {
      await Game.findOneAndUpdate({ UserId:await UserId }, { $set: await gameData });
    }
  } catch (error) {
    console.error('Error creating/updating game state:', await error);
  }
}
async function getGameState(UserId) {
  try {
    const game = await Game.findOne({ UserId: await UserId });
    return game;
  } catch (error) {
    console.error('Error getting game state:', error);
    return null;
  }
}
async function displayOptions(msg, serverGameState)
{

  let embed;
  let embed1;
  let image1 = await serverGameState.sixteenRandomSongs[0][1];
  let image2 = await serverGameState.sixteenRandomSongs[1][1];


  if(await image1 !== "noImage")
  {
    embed = new EmbedBuilder()
    .setColor(0xAEEEEE)
    .setAuthor({ name: `Round ${await serverGameState.round}`, iconURL: 'attachment://botBackground.jpeg' })
    .addFields({name: '\u200B', value: '🎧 '+ await serverGameState.sixteenRandomSongs[0][0]})
    .setImage(await image1);


  }
  else
  {
    embed = new EmbedBuilder()
    .setColor(0xAEEEEE)
    .setAuthor({ name: `Round ${await serverGameState.round}`, iconURL: 'attachment://botBackground.jpeg' })
    .addFields({name: '\u200B', value: '🎧 '+await serverGameState.sixteenRandomSongs[0][0]})
    .setImage('attachment://logos.png');


  }
  if(await image2 !== "noImage")
  {
    embed1 = new EmbedBuilder()
    .setColor(0xFFC0CB)
    .setImage(await image2)
    .addFields({name: '\u200B', value: '🌟 '+ await serverGameState.sixteenRandomSongs[1][0]})
    .setFooter({text: 'React with 🎧 or 🌟 to keep a song'});
  }
  else
  {
    embed1 = new EmbedBuilder()
    .setColor(0xAEEEEE)
    .setAuthor({ name: `Round ${await serverGameState.round}`, iconURL: 'attachment://botBackground.jpeg' })
    .addFields({name: '\u200B', value: '😎 '+ await serverGameState.sixteenRandomSongs[0][0]})
    .setImage(await image2);
  }

  await msg.channel.send({ embeds: [embed, embed1] , files: [file1]} ).then(async (sentEmbed)=>{



    if(await serverGameState.round === 8)
    {
      await msg.reply("You're halfway there! Keep going!");
    }
  
  });
    

  
}
async function initializeGameState() {
  return {
    gameProgress: false,
    sixteenRandomSongs: [],
    round: 1,


  };
}
async function displayNextRound(msg, chosenSong,  serverGameState)
{
  serverGameState.round = await serverGameState.round+1;

  await createOrUpdateGameState(await serverGameState.UserId, await serverGameState)
  await setupOptions(chosenSong, await serverGameState);
  if (await serverGameState.round <= 16) {
    await displayOptions(await msg, await serverGameState);

  } else {
    const winner = await serverGameState.sixteenRandomSongs[0];
    if(await winner[1] !== "noImage")
    {
      const getQuote = await getRandomIndexes(-1, 0, quotes.length, await serverGameState);
      const embed = new EmbedBuilder()
        .setColor(0xFFFF99)
        .setAuthor({name: 'Game Over', iconURL: 'attachment://botBackground.jpeg' })
        .setTitle('🎉 Winner! 🥳')
        .setDescription(quotes[getQuote])
        .addFields({name: '🎧 '+ winner[0],  value: '\u200B'})
        .setImage(winner[1])
        .setThumbnail('attachment://giphy.gif')
        .setFooter({ text: 'Type !ready to simulate another game!'});
      await msg.channel.send({ embeds: [ embed] , files:[file,file1]});
    } else if(winner[1] === "noImage"){
      const getQuote = await getRandomIndexes(-1, 0, quotes.length, await serverGameState);
      const embed = new EmbedBuilder()
        .setColor(0xFFFF99)
        .setAuthor({name: 'Game Over', iconURL: 'attachment://botBackground.jpeg' })
        .setTitle('🎉 Winner! 🥳')
        .setDescription(quotes[getQuote])
        .addFields({name: '🎧 '+ winner[0],  value: '\u200B'})
        .setImage('attachment://logos.png')
        .setThumbnail('attachment://giphy.gif')
        .setFooter({ text: 'Type !ready to simulate another game!'});
      await msg.channel.send({ embeds: [ embed] , files:[file,file1,file2]});
    }
    serverGameState.gameProgress = false;
    serverGameState.sixteenRandomSongs = [];
    serverGameState.round = 1;
    await createOrUpdateGameState(serverGameState.UserId,serverGameState);
  }
  
}
async function setupOptions(loss, serverGameState){
  const findSongToDelete = await serverGameState.sixteenRandomSongs.findIndex((msg) =>  msg[0] === loss[0]);
  await serverGameState.sixteenRandomSongs.splice(findSongToDelete, 1);
  await createOrUpdateGameState(await serverGameState.UserId, await serverGameState);

}
async function getPlaylistsItems(playlistId) {

  try {
    let tempList = [];
    let nextPageToken = '';
    let response = '';
    do {
      try {
      response = await fetch(`https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${youtubeKey}&pageToken=${nextPageToken}`);
      console.log("here")

        
      } catch (error) {
      response = await fetch(`https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId1}&key=${youtubeKey}&pageToken=${nextPageToken}`);
      }
      const data = await response.json();
    
      if (data.items) {
        tempList = tempList.concat(data.items);
      }
    
      nextPageToken = data.nextPageToken;
    
    } while (nextPageToken !== undefined && nextPageToken !== null && nextPageToken !== '');
    

    return tempList;

  } catch (error) {
    console.error('Error fetching YouTube data:', error);
    throw error;
  }
}  
client.on('ready', async () => {
  try {
    allGroups1 = await getPlaylistsItems(allGroups);
    console.log('Playlists updated successfully.');
    
  } catch (error) {
    console.error('Error updating playlists:', error);
  }
});

async function getSixteenRandomSongs(playlist, serverGameState){
  const callGetRandomIndex = await getRandomIndexes(await playlist, 0, await playlist.length, await serverGameState);
  let sixteenRandomSongs = [];
  for(let i = 0; i < await callGetRandomIndex.length; ++i)
  {
    sixteenRandomSongs.push(await getSongsInfo(await callGetRandomIndex[i], await playlist));
  }
  serverGameState.sixteenRandomSongs = sixteenRandomSongs;
  await createOrUpdateGameState(await serverGameState.UserId, await serverGameState);


}
async function getRandomIndexes(playlist, min, max,serverGameState) {
  if(await playlist !== -1)
  {
    const randomIndexes = [];
    const visitedIndexes = new Map();
    let temppastSongs = await serverGameState.pastSongs;
    while (randomIndexes.length < 17) {
      const randomIndex = Math.floor(Math.random() * (max - min)) + min;
      let isInPastSongs = false;
      for(let i = 0; i < await temppastSongs.length; ++i)
      {
        for(let j = 0; j < await temppastSongs[i].length; ++j)
        {
          if(await temppastSongs[i][j] === randomIndex)
          {
            isInPastSongs = true;
          }
        }
      }
      if (!visitedIndexes.has(randomIndex) && playlist[randomIndex].snippet.title !== 'Private Video' && playlist[randomIndex].snippet.title !== 'Private video' && isInPastSongs !== true ) {
        randomIndexes.push(randomIndex);
        visitedIndexes.set(randomIndex, true);
      }
    }
    serverGameState.pastSongs.push(randomIndexes); 

    let pastSongsThreeFourthsLength = (playlist.length * .33) / 17;
    while(serverGameState.pastSongs.length >= pastSongsThreeFourthsLength)
    {
      serverGameState.pastSongs.splice(0, 1);
      console.log("Deleted the first songs in past songs");
    }
    await createOrUpdateGameState(serverGameState.UserId, serverGameState);
    return randomIndexes;
  }
  else
  {
    return Math.floor(Math.random() * (max - min)) + min;;
  }
}


async function getSongsInfo(index, playlist) {
  let title = await playlist[index].snippet.title;
  const videoId = await playlist[index].snippet.resourceId.videoId;
  let urlVideo = `https://www.youtube.com/watch?v=${await videoId}`;
  let backgroundImage = '';

  if (await playlist[index].snippet.thumbnails.standard) {
    backgroundImage = await playlist[index].snippet.thumbnails.standard.url;
  } else if (await playlist[index].snippet.thumbnails.high) {
    backgroundImage = await playlist[index].snippet.thumbnails.high.url;
  } else if(await playlist[index].snippet.thumbnails.default){
    backgroundImage = await playlist[index].snippet.thumbnails.default.url;
  } else{
    backgroundImage = "noImage";
  }

  return [await title,  backgroundImage,  urlVideo];
}

async function startGame(serverGameState) {
  try {
    serverGameState.gameProgress = true;
    await createOrUpdateGameState(await serverGameState.UserId, await serverGameState);

  } catch (error) {
    console.error('Error starting the game:', error);
  }
}
function resetgame(serverGameState)
{
  serverGameState.gameProgress = false;
  serverGameState.sixteenRandomSongs = [];
  serverGameState.round = 1;
  createOrUpdateGameState(serverGameState.UserId, serverGameState);
}

client.on('messageCreate', async msg => {
  if (msg.author.bot) return;
  const UserId = msg.author.id;
  let serverGameState = await getGameState(UserId);
  if (msg.content === '!ready') {
    if (!serverGameState || !serverGameState.gameProgress) {
      serverGameState = await initializeGameState();
      await createOrUpdateGameState(UserId, serverGameState);
      serverGameState = await Game.findOne({ UserId: UserId });
      await startGame(serverGameState);
      await getSixteenRandomSongs(allGroups1, serverGameState);
      await displayOptions(msg, serverGameState);
      serverGameState.gameProgress = true;
      await createOrUpdateGameState(UserId, serverGameState);
    } 
    else {
      msg.reply("You currently have a game in progress...if you loss your current match, type !reset to end it and start a new one");
    }
  }
  else if(msg.content === "!reset")
  {
    if(!serverGameState)
    {
      msg.reply("You currently don't have a game activated...");
      return;
    }
    else{
      serverGameState = await Game.findOne({ UserId: UserId });
      if(serverGameState.gameProgress === false)
      {
        msg.reply("You currently don't have a game activated...");
      }
      else
      {
        resetgame(serverGameState);
        msg.reply("Your current game has been resetted...type !ready if you wish to start a new one");
      }
    }
  }

  
});
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  const { message } = reaction;
  const UserId = user.id;
  let serverGameState = await getGameState(UserId);
  if (!serverGameState||!serverGameState.gameProgress || UserId !== serverGameState.UserId || message.embeds[0].image.url !==  await serverGameState.sixteenRandomSongs[0][1]) {
    return;
  }

  if (message.embeds.length && message.embeds[1].footer.text === 'React with 🎧 or 🌟 to keep a song' && (serverGameState.gameProgress === true) ) {
    const choice = reaction.emoji.name;
    if (choice === '🎧' || choice === '🌟') {

      const deleteIndex = choice === '🎧' ? 2 : 1;
      const songToDelete = await serverGameState.sixteenRandomSongs[deleteIndex - 1];
      await displayNextRound(message, songToDelete,  serverGameState);

    }
  }
});

mongoose.connect(mongoDBUrl).then(()=> {
  console.log("Connected to Database");
}).catch((err)=>{
  console.log(err);
  console.log(mongoDBUrl);
})
client.login(process.env.TOKEN);
