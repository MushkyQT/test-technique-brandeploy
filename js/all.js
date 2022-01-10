// IGNORING endRating class in favor of being able to cancel your vote even on the results page. Hope it's OK!
// Otherwise I would have set the endRating class on body in processVotes()
const FIRST_RATING_CLASS = 'firstRating',
  END_RATING_CLASS = 'endRating',
  EVALUATING_CLASS = 'evaluating';

// Define consts including function to fetch all items (articles) that are not evaluated
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
  // voteStack is updated by handleItemAction() & handleItemCancel() for every vote
  // and is used as a sort of 'history/state' for cancel functionality
  'voteStack': []
}

//------------------------------------START MAIN LOGIC---------------------------------------
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

// Handle animations, vote data, and display classes
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
      clearStamps(currentItem)
    }, timeout)
  } else {
    currentItem.classList.remove(`moving_${actionType}`)
    setEvaluated(currentItem)
    setEvaluating(nextItem)
  }
}

// Manage voteStack to handle vote cancellation by reverting to previous item in stack
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

// Handles actions received from function call in checkClickTarget()
// and calls handleItemAction() with relevant data
function triggerItemAction(actionType) {
  let filteredItems = filterEvaluatedItems()
  let currentItem = filteredItems[0]
  let nextItem = filteredItems[1]

  // If the current item is NOT the results article, handle vote action
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
    // If the next item IS the results article, call processVotes() to update results article HTML
    if (nextItem.classList.contains('result')) {
      processVotes()
    }
  } else {
    // Handle cancelling from final results view
    actionType === 'cancel' ? handleItemCancel(currentItem) : console.log('Finished voting! Did you mean to cancel?')
  }

  cancelAllowed()
}

function clearStamps(item) {
  item.querySelectorAll('.stamp').forEach(stamp => {
    stamp.style.opacity = '0'
  })
}

// Sets clickable state of vote nav 'cancel' button if not first vote in voteStack
function cancelAllowed() {
  if (votes.voteStack.length === 0) {
    document.body.classList.add('firstRating')
  } else {
    document.body.classList.remove('firstRating')
  }
}

// Handle clicks on nav elements and trigger relevant vote action
function checkClickTarget(e) {
  let target = e.target
  if (target.tagName === 'A') {
    triggerItemAction(target.dataset.action)
  }
}

//------------------------------------END MAIN LOGIC---------------------------------------

//------------------------------------START TOUCH API------------------------------------------
let isDragging = false,
  startPos = {},
  currentTranslateX = 0,
  currentTranslateY = 0,
  animationID = 0,
  currentItem = 0

// Create even listeners for touch events as well as their mouse API equivalents
items.forEach(item => {
  if (!item.classList.contains('result')) {
    item.addEventListener('dragstart', e => e.preventDefault())

    // Touch events
    item.addEventListener('touchstart', touchStart(item))
    item.addEventListener('touchend', touchEnd)
    item.addEventListener('touchmove', touchMove)

    // Mouse event translations
    item.addEventListener('mousedown', touchStart(item))
    item.addEventListener('mouseup', touchEnd)
    item.addEventListener('mousemove', touchMove)
    item.addEventListener('mouseleave', touchEnd)
  }
})

// Get starting X and Y positions of cursor during drag for touch or mouse
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

// Handle stamp opacity during drag based on currentTranslate X/Y and window width/height values
// As well as update current values for use in touchEnd()
function touchMove(ev) {
  if (isDragging) {
    const currentPosX = getPosX(ev)
    const currentPosY = getPosY(ev)
    currentTranslateX = currentPosX - startPos.X
    currentTranslateY = currentPosY - startPos.Y
    const movedX = currentTranslateX
    const movedY = currentTranslateY
    if (movedY > 100) {
      setStampOpacity(currentTranslateY, window.innerHeight, 'nothing')
    } else {
      if (movedX < -100) {
        setStampOpacity(currentTranslateX, window.innerWidth, 'dislike')
      }
      if (movedX > 100) {
        setStampOpacity(currentTranslateX, window.innerWidth, 'like')
      }
    }
  }
}

// Call setFinalDirection() with final position values and reset said values for next item
function touchEnd() {
  cancelAnimationFrame(animationID)
  isDragging = false
  const movedX = currentTranslateX
  const movedY = currentTranslateY
  currentTranslateY = 0
  currentTranslateX = 0
  setFinalDirection(movedX, movedY)
}

function setFinalDirection(movedX, movedY) {
  if (movedY > 150) {
    triggerItemAction('nothing')
  } else {
    if (movedX < -100) {
      triggerItemAction('dislike')
    }
    if (movedX > 100) {
      triggerItemAction('like')
    }
  }
}

function setStampOpacity(posOffset, windowAxis, actionType) {
  clearStamps(currentItem)
  const opacity = ((Math.abs(posOffset) / windowAxis) * 100) + 20
  currentItem.querySelector(`.stamp_${actionType}`).style.opacity = `${Math.floor(opacity)}%`
}

function animation() {
  setItemPosition()
  if (isDragging) requestAnimationFrame(animation)
}

function setItemPosition() {
  currentItem.style.transform = `translateX(${currentTranslateX}px) translateY(${currentTranslateY}px)`
}

//------------------------------------END TOUCH API------------------------------------------

// Listen for clicks on action buttons
document.querySelector('nav').addEventListener('click', checkClickTarget)

// Set evaluating class on initial item
setEvaluating(items[0])

// Disable cancel button for initial item
cancelAllowed()