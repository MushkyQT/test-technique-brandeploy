// IGNORING endRating class in favor of being able to cancel your vote even on the results page. Hope it's OK!
// Otherwise I would have set the endRating class on body in processVotes()
const FIRST_RATING_CLASS = 'firstRating',
  END_RATING_CLASS = 'endRating',
  EVALUATING_CLASS = 'evaluating';

const items = document.querySelectorAll('article'),
  filterEvaluatedItems = () => [...items].filter(item => !item.classList.contains('evaluated')),
  setEvaluating = target => {
    if (target.classList.length > 0) {
      target.classList.remove('evaluated')
    }
    target.classList.add('evaluating')
  },
  setEvaluated = target => {
    target.classList.remove('evaluating')
    target.classList.add('evaluated')
  }

let votes = {
  'like': 0,
  'dislike': 0,
  'nothing': 0,
  'evaluations': 0,
  'voteStack': []
}

function processVotes() {
  const resultDisplays = document.querySelectorAll('.result span')
  resultDisplays.forEach(result => {
    switch (result.className) {
      case 'result_like':
        result.innerHTML = votes.like
        break
      case 'result_evaluated':
        votes.evaluations = votes.like + votes.dislike
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
  votes.voteStack.push({
    'action': actionType,
    'item': currentItem
  })
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
    console.log(votes.voteStack)
  }
}

function handleItemCancel(currentItem) {
  let itemToCancel = votes.voteStack[votes.voteStack.length - 1]
  votes[itemToCancel.action]--
  votes.evaluations--
  currentItem.classList.remove('evaluating')
  setEvaluating(itemToCancel.item)
  itemToCancel.item.style.animationDirection = 'reverse'
  itemToCancel.item.classList.add(`moving_${itemToCancel.action}`)
  setTimeout(() => {
    itemToCancel.item.classList.remove(`moving_${itemToCancel.action}`)
    itemToCancel.item.style.animationDirection = ''
  }, 300)
  votes.voteStack.pop()
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
        handleItemCancel(currentItem)
        break
      default:
        break
    }
    if (nextItem.classList.contains('result')) {
      processVotes()
    }
  } else {
    actionType === 'cancel' ? handleItemCancel(currentItem) : console.log('Finished voting! Did you mean to cancel?')
  }
}

function cancelAllowed() {
  if (votes.voteStack.length === 0) {
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

// TOUCH API
let isDragging = false,
  startPos = {},
  currentTranslateX = 0,
  currentTranslateY = 0,
  prevTranslateX = 0,
  prevTranslateY = 0,
  animationID = 0,
  currentItem = 0

items.forEach((item, index) => {
  item.addEventListener('dragstart', e => e.preventDefault())

  // Touch events
  item.addEventListener('touchstart', touchStart(index))
  item.addEventListener('touchend', touchEnd)
  item.addEventListener('touchmove', touchMove)

  // Mouse event translations
  item.addEventListener('mousedown', touchStart(index))
  item.addEventListener('mouseup', touchEnd)
  item.addEventListener('mousemove', touchMove)
  item.addEventListener('mouseleave', touchEnd)
})

function getPosX(ev) {
  return ev.type.includes('mouse') ? ev.pageX : ev.touches[0].clientX
}

function getPosY(ev) {
  return ev.type.includes('mouse') ? ev.pageY : ev.touches[0].clientY
}

function touchStart(item) {
  return function (ev) {
    isDragging = true
    currentItem = item
    startPos = {
      'X': getPosX(ev),
      'Y': getPosY(ev)
    }
    animationID = requestAnimationFrame(animation)
  }
}

function touchMove(ev) {
  if (isDragging) {
    const currentPosX = getPosX(ev)
    const currentPosY = getPosY(ev)
    currentTranslateX = prevTranslateX + currentPosX - startPos.X
    currentTranslateY = prevTranslateY + currentPosY - startPos.Y
  }
}

function touchEnd() {
  cancelAnimationFrame(animationID)
  isDragging = false
}


function animation() {
  setItemPosition()
  if (isDragging) requestAnimationFrame(animation)
}

function setItemPosition() {
  items[0].style.transform = `translateX(${currentTranslateX}px) translateY(${currentTranslateY}px)`
}

// END TOUCH API

// Listen for clicks on action buttons
document.querySelector('nav').addEventListener('click', checkClickTarget)

// Set evaluating class on initial item
setEvaluating(items[0])

// Disable cancel button for initial item
cancelAllowed()