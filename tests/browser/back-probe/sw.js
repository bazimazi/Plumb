// chrome.tabs.goBack() runs NavigationController::GoBack(), the path of the toolbar Back button and of
// Android's WebView.goBack(). Unlike history.back() or CDP navigation, it skips skippable entries.
self.pressBack = async () => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  await chrome.tabs.goBack(tab.id)
}
