chrome.runtime.onInstalled.addListener(() => {
    console.log('Game Calendar Extension installed');
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name.startsWith('event-')) {
        chrome.storage.local.get(['calendarEvents'], (result) => {
            const event = result.calendarEvents.find(
                e => `event-${e.id}` === alarm.name
            );
            if (event) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icon.png',
                    title: 'Upcoming Event',
                    message: `${event.title} starts in 1 hour!`
                });
            }
        });
    }
});
