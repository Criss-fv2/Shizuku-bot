// utils/textTools.js

// Emojis de reacción
const emojiReactions = ['😊', '❤️', '😍', '😂', '😢']

const getRandomEmoji = () => {
  return emojiReactions[Math.floor(Math.random() * emojiReactions.length)]
}

// Reescritura de texto
const rewriteText = (text = '', style = 'normal') => {
  if (!text) return ''

  switch (style) {
    case 'uppercase':
      return text.toUpperCase()

    case 'lowercase':
      return text.toLowerCase()

    case 'italic':
      return `*${text}*`

    case 'bold':
      return `*${text}*`

    case 'reverse':
      return text.split('').reverse().join('')

    default:
      return text
  }
}

// Respuestas románticas
const romanticResponses = [
  'You light up my world!',
  'You are my high point of every day!',
  'Together forever!',
  'You make my heart race!',
  'You are the missing piece of my puzzle!'
]

const getRandomRomanticResponse = () => {
  return romanticResponses[Math.floor(Math.random() * romanticResponses.length)]
}

// Modo combo
const comboMode = (text = '') => {
  const emoji = getRandomEmoji()
  const romantic = getRandomRomanticResponse()
  const rewritten = rewriteText(text, 'uppercase')

  return `${rewritten} ${emoji} ${romantic}`
}

export {
  getRandomEmoji,
  rewriteText,
  getRandomRomanticResponse,
  comboMode
}