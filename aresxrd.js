const Discord = require('discord.js');
const aresxrd = new Discord.Client()
require('discord-buttons')(aresxrd)
const ayarlar = require("./settings.json")
const chalk = require("chalk")
const fs = require("fs")
const moment = require("moment")
const db = require("quick.db")
const request = require("request")
const express = require("express")
const http = require("http")
const app = express()
const logs = require("discord-logs")
require("moment-duration-format")
logs(aresxrd)
require("./util/eventLoader")(aresxrd)
var prefix = ayarlar.prefix

aresxrd.gif = {
  kategoriler: ayarlar.kategoriler,
  log: ayarlar.giflog,
  sunucu: ayarlar.sunucuadı,
}
aresxrd.commands = new Discord.Collection();
aresxrd.aliases = new Discord.Collection();
fs.readdir("./komutlar/", (err, files) => {
  if (err) console.error(err);
  console.log(`${files.length} komut yüklenecek.`);
  files.forEach(f => {
    let props = require(`./komutlar/${f}`);
    console.log(`Yüklenen komut ${props.conf.name}.`);
    aresxrd.commands.set(props.conf.name, props);
    props.conf.aliases.forEach(alias => {
      aresxrd.aliases.set(alias, props.conf.name);
    });
  });
});


aresxrd.reload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      aresxrd.commands.delete(command);
      aresxrd.aliases.forEach((cmd, alias) => {
        if (cmd === command) aresxrd.aliases.delete(alias);
      });
      aresxrd.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        aresxrd.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

aresxrd.unload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      aresxrd.commands.delete(command);
      aresxrd.aliases.forEach((cmd, alias) => {
        if (cmd === command) aresxrd.aliases.delete(alias);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};
aresxrd.on('message', async msg =>{
  let categories = aresxrd.gif.kategoriler
  if(msg.attachments.size == 0&&categories.includes(msg.channel.parentID)){
  if(msg.author.bot) return;
  msg.delete({timeout:500})
  msg.reply('\n :flag_tr: Bu kanalda sadece banner , pp ve gif paylaşabilirsin! \n :flag_us: You can only share banner , pp and gif on this channel!').then(m=>m.delete({timeout:2000}))
}
  if(msg.attachments.size > 0 && categories.includes(msg.channel.parentID)){
  db.add(`sayı.${msg.author.id}`,msg.attachments.size)
  let emojis = ['🎄','💸','🫒','🍹','🌙']
  var random = Math.floor(Math.random()*(emojis.length));
  let pp = 0
  let gif = 0
  msg.attachments.forEach(atch=>{
   if(atch.url.endsWith('.webp')||atch.url.endsWith('.png')||atch.url.endsWith('.jpeg')||atch.url.endsWith('.jpg')){
     db.add(`pp.${msg.author.id}`,1)
     pp = pp + 1
   }
    if(atch.url.endsWith('.gif')){
     db.add(`gif.${msg.author.id}`,1)
      gif = gif +1
    }
  })
db.add(`kanaltoplam_${msg.channel.id}_${msg.author.id}`, 1)
  let mesaj = ``
  if(gif > 0 && pp === 0){
    mesaj = `${gif} gif`
  }
if(pp > 0 && gif === 0){
    mesaj = `${pp} pp`
  }
if(gif > 0 && pp > 0){
    mesaj = `${pp} pp, ${gif} gif`
  }
  aresxrd.channels.cache.get(aresxrd.gif.log).send(new Discord.MessageEmbed().setColor("RANDOM").setThumbnail(msg.author.avatarURL({ dynamic: true })).setAuthor(msg.guild.name, msg.guild.iconURL({ dynamic: true })).setDescription(`${msg.author} - \`${msg.author.id}\` Kullanıcısı \n<#${msg.channel.id}> kanalına **${mesaj}** gönderdi\n\n**Detaylı Bilgi;**\n Toplam paylaştığı gif sayısı: **${db.fetch(`gif.${msg.author.id}`)||0}**\n Toplam paylaştığı pp sayısı: **${db.fetch(`pp.${msg.author.id}`)||0}**`))
}
})

aresxrd.on("messageDelete", async message => {
 let mesaj = message.guild.channels.cache.get(ayarlar.silinenmesajlog) 
if(mesaj) {
  if (message.author.bot || message.channel.type == "dm") return;
const mesajemb = new Discord.MessageEmbed()
  if (message.attachments.first()) {
mesaj.send(mesajemb.setAuthor("Fotoğraf Silindi")
.setDescription(`
• Kullanıcı: ${message.author}
• Kanal İsmi: \`${message.channel.name}\`
• Mesaj ID: \`${message.id}\`

• Fotoğraf İçeriği: \n\n`).setImage(message.attachments.first().proxyURL
).setColor("RANDOM").setThumbnail(aresxrd.user.avatarURL));
    } else { 
mesaj.send(mesajemb.setAuthor("Mesaj Silindi")
.setDescription(`
• Kullanıcı: ${message.author}
• Kanal İsmi: \`${message.channel.name}\`
• Mesaj ID: \`${message.id}\`

• Mesaj İçeriği: **${message.content}**
`).setColor("RANDOM").setThumbnail(aresxrd.user.avatarURL));
    }}
});

aresxrd.on('messageUpdate', async (oldMessage, newMessage) => {
 let mesaj = oldMessage.guild.channels.cache.get(ayarlar.düzenlenenmesajlog) 
if(mesaj) {
const jaylenEmb = new Discord.MessageEmbed()
if (oldMessage.author.bot) return;
if (!oldMessage.guild) return;
if (oldMessage.content == newMessage.content) return;

mesaj.send(jaylenEmb.setAuthor("Mesaj Düzenlendi")
.setDescription(`
• Kullanıcı: ${oldMessage.author}
• Kanal İsmi: \`${oldMessage.channel.name}\`
• Mesaj ID: \`${oldMessage.id}\`

• Eski Mesaj İçeriği: **${oldMessage.content}**
• Yeni Mesaj İçeriği: **${newMessage.content}**
`).setColor("RANDOM").setThumbnail(aresxrd.user.avatarURL)); 
  }}
);

//reklam-engel
aresxrd.on("message", msg => {
        const reklam = [".com", ".net", ".xyz", ".tk", ".pw", ".io", ".me", ".gg", "www.", "https", "http", ".gl", ".org", ".com.tr", ".biz", "net", ".rf.gd", ".az", ".party", "discord.gg",];
        if (reklam.some(word => msg.content.includes(word))) {
          try {
            if (!msg.member.hasPermission("ADMINISTRATOR")) {
                  msg.delete({timeout:500})
                    return msg.channel.send(`${msg.author} Bu sunucuda link yasak`).then(x => x.delete({timeout: 5000}));
            }              
          } catch(err) {
            console.log(err);
          }
        }
    });

  aresxrd.on('guildMemberAdd', async member => {
    const reklamisim = ["j4j","discord.gg/", "https://discord.gg", "invite", "join"]; 


     if (reklamisim.some(word => member.user.username.includes(word)) ) { 
        member.ban({ 
            reason: `İsminde reklam olduğundan dolayı banlandı.`, 
          }) 
   } 

  });

aresxrd.elevation = message => {
  if (!message.guild) {
    return;
  }
  let permlvl = 0;
  if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
  if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;//
  if (message.author.id === ayarlar.sahip) permlvl = 4;//
  return permlvl;
};

var regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;//
aresxrd.on("warn", e => {
  console.log(chalk.bgYellow(e.replace(regToken, "that was redacted")));
});
aresxrd.on("error", e => {
  console.log(chalk.bgRed(e.replace(regToken, "that was redacted")));
});

aresxrd.on("ready",()=>{
  aresxrd.user.setActivity(ayarlar.botDurum, {
    type: "STREAMING",
    url: "https://www.twitch.tv/aresxxdd"})
        .then(presence => console.log(`Bot Twitch Yayında ${presence.game ? presence.game.none : 'Kanki'}`))
        .catch(console.error);
})

////////////   random pp-gif   /////////////////
aresxrd.on(`userUpdate`, (oldUser, newUser) => {
  let avatar = newUser.avatarURL({ dynamic: true, format: "png", size: 1024 }).split('?')[0]

if(avatar.endsWith('.png') || avatar.endsWith('.jpg') || avatar.endsWith('.webp')) {
aresxrd.channels.cache.get(ayarlar.aresxrdrandompp).send(`${newUser.avatarURL({ dynamic: true, size: 1024 })}`)
}
if(avatar.endsWith('.gif')) {
aresxrd.channels.cache.get(ayarlar.aresxrdrandomgif).send(`${newUser.avatarURL({ dynamic: true, size: 1024 })}`)
}
})
////////////   random pp-gif/////////////////
////////////   random banner  /////////////////



////////////   random banner /////////////////
////////////   oto rol ////////////
aresxrd.on('guildMemberAdd', async(member) => {
member.roles.add(ayarlar.otorol)
})
////////////   oto rol ////////////
aresxrd.on('ready', () => {
    aresxrd.ws.on('INTERACTION_CREATE', async interaction => {
        
        let name = interaction.data.custom_id

        let GameMap = new Map([
            ["mavi",`${ayarlar.mavirol}`],
            ["kirmizi",`${ayarlar.kırmızırol}`],
            ["sari",`${ayarlar.sarırol}`],
            ["yesil",`${ayarlar.yesilrol}`],
            ["siyah",`${ayarlar.siyahrol}`],

            ["banner",`${ayarlar.banner}`],
            ["nfsw",`${ayarlar.nfsw}`],
        ])

        let member = await aresxrd.guilds.cache.get(ayarlar.guildID).members.fetch(interaction.member.user.id)
        if(!GameMap.has(name) || !member) return;

        let role = GameMap.get(name)
        let returnText;

        if(member.roles.cache.has(role)){
            await member.roles.remove(role)
            returnText = `Rol üzerinizden alındı`
        }else{
            await member.roles.add(role)
            returnText = `Rol üzerinize verildi`

        }
        
        aresxrd.api.interactions(interaction.id, interaction.token).callback.post({
            data: {
                type: 4,
                data: {
                    content: returnText,
                    flags: "64" // Gizli reply atmak için girmeniz gereken flag
                }
            }
        })
        
    });
});

console.log('Bot Başarıyla Aktif Edildi')
aresxrd.login(ayarlar.token).catch(err=> console.error('Tokeni Yenileyip Tekrar Girin'));
