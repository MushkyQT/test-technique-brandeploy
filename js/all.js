const FIRST_RATING_CLASS = 'firstRating',
  END_RATING_CLASS = 'endRating',
  EVALUATING_CLASS = 'evaluating';

const items = document.querySelectorAll('article')
const filterEvaluatedItems = () => [...items].filter(item => !item.classList.contains('evaluated'))
const setEvaluating = target => {
  if (target.classList.length > 0) {
    target.classList.remove('evaluated')
  }
  target.classList.add('evaluating')
}
const setEvaluated = target => {
  target.classList.remove('evaluating')
  target.classList.add('evaluated')
}

let votes = {
  'like': 0,
  'dislike': 0,
  'nothing': 0,
  'evaluations': 0,
  'lastVote': null
}

function processVotes() {
  const resultDisplays = document.querySelectorAll('.result span')
  resultDisplays.forEach(result => {
    switch (result.className) {
      case 'result_like':
        result.innerHTML = votes.like
        break
      case 'result_evaluated':
        result.innerHTML = votes.evaluations
        break
      case 'result_dislike':
        result.innerHTML = votes.dislike
        break
      case 'result_nothing':
        result.innerHTML = votes.nothing
        break
    }
  })
}

function handleItemAction(currentItem, actionType, timeout, nextItem) {
  votes[actionType]++
  votes.lastVote = actionType
  votes.evaluations++
  currentItem.classList.add(`moving_${actionType}`)
  if (timeout > 0) {
    setTimeout(() => {
      currentItem.classList.remove(`moving_${actionType}`)
      setEvaluated(currentItem)
      setEvaluating(nextItem)
    }, timeout)
  } else {
    currentItem.classList.remove(`moving_${actionType}`)
    setEvaluated(currentItem)
    setEvaluating(nextItem)
  }
  if (nextItem.classList.contains('result')) {
    console.log('Results time!')
  }
}

function triggerItemAction(actionType) {
  let filteredItems = filterEvaluatedItems()
  let currentItem = filteredItems[0]
  let nextItem = filteredItems[1]

  if (!currentItem.classList.contains('result')) {
    switch (actionType) {
      case 'like':
        handleItemAction(currentItem, actionType, 300, nextItem)
        break
      case 'dislike':
        handleItemAction(currentItem, actionType, 300, nextItem)
        break
      case 'nothing':
        handleItemAction(currentItem, actionType, 300, nextItem)
        break
      case 'cancel':
        console.log('Handle cancel')
        break
      default:
        break
    }

    if (nextItem.classList.contains('result')) {
      processVotes()
    }
  } else {
    console.log('Already finished voting! Want to cancel?')
  }
}

function cancelAllowed() {
  if (votes.evaluations === 0) {
    document.body.classList.add('firstRating')
  } else {
    document.body.classList.remove('firstRating')
  }
}

function checkClickTarget(e) {
  let target = e.target
  if (target.tagName === 'A') {
    triggerItemAction(target.dataset.action)
    cancelAllowed()
  }
}

document.querySelector('nav').addEventListener('click', checkClickTarget)
setEvaluating(items[0])
cancelAllowed()