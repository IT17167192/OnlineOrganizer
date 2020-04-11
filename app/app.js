let app = angular
    .module('OnlineOrganizer', ['ngMaterial', 'toaster', 'ngAnimate'])
    .controller("eventDetails", function ($scope, $interval, toaster) {
        $scope.eventTime = new Date().toLocaleString('en-US', {hour: 'numeric', minute: 'numeric', hour12: true});
        $scope.eventDate = new Date();

        //events date wise
        let eventsOrderByDate = [];
        $scope.eventsOrderByDate = eventsOrderByDate;
        //Events for selected date
        $scope.eventsForSelectedDate = [];

        //keep information about errors
        $scope.error = {};

        //Toaster popup function
        const pop = function (message) {
            let toastInstance = toaster.pop({type: message.type, body: message.body});
        };

        //returns the next event
        $scope.getNextEvent = () => {
            if ($scope.eventsForSelectedDate.length > 0) {
                //consider first element of the array
                let nextEventDate = $scope.eventsForSelectedDate[0].distinctDate;
                //consider next event object as the first element
                let nextEventObject = $scope.eventsForSelectedDate[0];
                //get the object that includes the most old date
                $scope.eventsForSelectedDate.forEach(event => {
                    if (nextEventDate >= event.distinctDate) {
                        nextEventDate = event.distinctDate;
                        nextEventObject = event;
                    }
                });
                //The next event exist in the object where has the oldest date
                let nextEvent = nextEventObject.eventsUnderDate[0];
                //get the event which has the oldest time
                nextEventObject.eventsUnderDate.forEach(next => {
                    if (next.eventTimeInStandardHours <= nextEvent.eventTimeInStandardHours) {
                        nextEvent = next;
                    }
                });
                //returns the object which includes the oldest date
                return nextEvent;
            } else if ($scope.eventsOrderByDate.length > 0) {
                //consider first element of the array
                let nextEventDate = $scope.eventsOrderByDate[0].distinctDate;
                //consider next event object as the first element
                let nextEventObject = $scope.eventsOrderByDate[0];
                //get the object that includes the most old date
                $scope.eventsOrderByDate.forEach(event => {
                    if (nextEventDate >= event.distinctDate) {
                        nextEventDate = event.distinctDate;
                        nextEventObject = event;
                    }
                });
                //The next event exist in the object where has the oldest date
                let nextEvent = nextEventObject.eventsUnderDate[0];
                //get the event which has the oldest time
                nextEventObject.eventsUnderDate.forEach(next => {
                    if (next.eventTimeInStandardHours <= nextEvent.eventTimeInStandardHours) {
                        nextEvent = next;
                    }
                });
                //returns the object which includes the oldest date
                return nextEvent;
            }
            //If the events are empty returns null object
            return;
        };

        const getTimeFromLocaleString = (eventDate, eventTime) => {
            let date = eventDate.split('-');
            let time = eventTime.split(' ')[0].split(':');
            let identifier = eventTime.split(' ')[1];
            if (identifier === 'PM') {
                if (time[0] !== '12') {
                    time[0] = '' + (parseInt(time[0]) + 12);
                }
                return new Date(date[0], (date[1] - 1), date[2], time[0], time[1]);
            } else {
                if (time[0] !== '12') {
                    return new Date(date[0], (date[1] - 1), date[2], time[0], time[1]);
                }
                return new Date(date[0], (date[1] - 1), date[2], "00", time[1]);
            }
        };

        $interval(function () {
            let nextEvent = $scope.getNextEvent();
            if (nextEvent) {
                let time = getTimeFromLocaleString(dateConvert(nextEvent.eventDate), nextEvent.eventTime);
                let t = Date.parse(time) - Date.now();
                $scope.rSeconds = Math.floor((t / 1000) % 60);
                $scope.rMinutes = Math.floor((t / 1000 / 60) % 60);
                $scope.rHours = Math.floor((t / (1000 * 60 * 60)) % 24);
                $scope.rDays = Math.floor(t / (1000 * 60 * 60 * 24));
                if ($scope.rDays === 0 && $scope.rHours === 0 && $scope.rMinutes === 0 && $scope.rSeconds === 0) {
                    //Popup message
                    const popupMessage = {
                        type: "warning",
                        body: "Event : " + nextEvent.eventName + " is overdue"
                    };
                    //Display popup
                    pop(popupMessage);
                    $scope.deleteEvent(nextEvent.id, "overdue");
                }
            }
        }, 1000);

        //Add event function
        $scope.addEvent = () => {
            //checking event name, event date and event time validation
            //Name cannot be empty
            //Date must be a future date
            //Time also must be a future time
            //checks the date and time with current date and time
            //If date is a future date, then current time or higher is acceptable
            //If the date is equal to current date, then current time is not acceptable. Only future times are expected
            if ($scope.eventName && (dateConvert(Date.now()) <= dateConvert($scope.eventDate)) && ((dateConvert(Date.now()) === dateConvert($scope.eventDate)) && (getTimeInStandardHours($scope.eventTime) > getTimeInStandardHours(new Date().toLocaleString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
            }))) || (dateConvert(Date.now()) !== dateConvert($scope.eventDate)))) {

                //no errors
                $scope.error = {
                    show: $scope.error.show ? !$scope.error.show : false
                };
                //create event object
                let event = {
                    id: Date.now(),
                    eventName: $scope.eventName,
                    eventTime: $scope.eventTime,
                    eventTimeInStandardHours: getTimeInStandardHours($scope.eventTime),
                    eventDate: $scope.eventDate
                };
                //getEventsOrderByDate returns all events order by the date
                //if there are null arrays, clear them
                eventsOrderByDate = eventsOrderByDate.filter(event => event.eventsUnderDate.length > 0);
                eventsOrderByDate = getEventsOrderByDate(event, eventsOrderByDate);

                //Re initializing variables
                $scope.eventName = '';
                $scope.eventTime = new Date().toLocaleString('en-US', {
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true
                });
                $scope.eventDate = new Date();
                $scope.eventsOrderByDate = eventsOrderByDate;

            } else {
                //has errors
                $scope.error = {
                    show: true,
                    errorName: !$scope.eventName ? 'Name cannot be empty' : '',
                    errorDate: !(dateConvert(Date.now()) <= dateConvert($scope.eventDate)) ? 'Date must be a future date' : '',
                    errorTime: (getTimeInStandardHours($scope.eventTime) <= getTimeInStandardHours(new Date().toLocaleString('en-US', {
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                    }))) ? 'Time must be a future time' : ''
                }
            }

        };

        //get time in 24 hours in order to sort the events by time
        //21:00:00 , 09:00:00
        //special 12:00 PM = 12:00:00  and 12:00 AM = 00:00:00 AM
        const getTimeInStandardHours = (eventTime) => {
            let time = eventTime.split(' ')[0].split(':');
            let identifier = eventTime.split(' ')[1];

            let seconds = new Date().getSeconds();
            if (new Date().getSeconds() < 10) {
                seconds = "0" + new Date().getSeconds();
            }

            if (identifier === 'PM') {
                if (time[0] !== '12') {
                    time[0] = '' + (parseInt(time[0]) + 12);
                }
                return time[0] + ":" + time[1] + ":" + seconds;
            } else {
                if (time[0] !== '12') {
                    return time[0] < 10 ? "0" + time[0] + ":" + time[1] + ":" + seconds : time[0] + ":" + time[1] + ":" + seconds;
                }
                return "00" + ":" + time[1] + ":" + seconds;
            }
        };

        //returns events for the selected date
        $scope.getEventsForSelectedDate = () => {
            if ($scope.eventsOrderByDate) {
                $scope.eventsForSelectedDate = [];
                $scope.eventsForSelectedDate = $scope.eventsOrderByDate.filter(event => dateConvert(event.distinctDate) === dateConvert($scope.eventDate));
            }
        }

        //delete function
        $scope.deleteEvent = (id, action) => {
            $scope.eventsOrderByDate.forEach(eventByDate => {
                eventByDate.eventsUnderDate = eventByDate.eventsUnderDate.filter(event => event.id !== id);
                //if the action performed by the user
                //Display popup message
                if(action === 'userDelete'){
                    const popupMessage = {
                      type: "success",
                      body: "Event is deleted successfully!"
                    };
                    pop(popupMessage);
                }
            });
            //if there are null arrays, clear them
            $scope.eventsOrderByDate = $scope.eventsOrderByDate.filter(event => event.eventsUnderDate.length > 0);
            //if there are null arrays in selectedDate object clear them
            $scope.eventsForSelectedDate = $scope.eventsForSelectedDate.filter(event => event.eventsUnderDate.length > 0);

            //check for latest once delete action is performed
            $scope.getNextEvent();

        };

        $scope.editEvent = (id) => {
            let eventObject;
            $scope.eventsOrderByDate.forEach(eventByDate => {
                eventObject = eventByDate.eventsUnderDate.filter(event => event.id === id);
            });

            if (eventObject) {
                //Popup message
                const popupMessage = {
                    type: "info",
                    body: eventObject[0].eventName + " edit now!"
                };
                //Display popup
                pop(popupMessage);
                $scope.eventTime = eventObject[0].eventTime;
                $scope.eventDate = eventObject[0].eventDate;
                $scope.eventName = eventObject[0].eventName;
            }

            $scope.deleteEvent(id, "edit");
            console.log(eventObject);

        };

        //all key events can be processed
        $scope.checkKeyPressEvent = (keyEvent) => {
            //enter key press event
            if (keyEvent.which === 13) {
                $scope.addEvent();
            }
        };

        //given date string convert to dd/MM/yyyy format
        const dateConvert = (dateStr) => {
            let date = new Date(dateStr),
                mnth = ("0" + (date.getMonth() + 1)).slice(-2),
                day = ("0" + date.getDate()).slice(-2);
            return [date.getFullYear(), mnth, day].join("-");
        };

        //generate and return events ordered by dates
        const getEventsOrderByDate = (event, eventsOrderByDate) => {
            //Popup message
            const popupMessage = {
                type: "success",
                body: "Event is successfully added!"
            };

            if (eventsOrderByDate.length === 0) {
                eventsOrderByDate.push({
                    distinctDate: event.eventDate,
                    eventsUnderDate: [{
                        id: event.id,
                        eventName: event.eventName,
                        eventTime: event.eventTime,
                        eventTimeInStandardHours: event.eventTimeInStandardHours,
                        eventDate: event.eventDate
                    }]
                });
            } else {
                let dateExist = false;
                eventsOrderByDate.forEach(eventOrderByDate => {
                    if (dateConvert(eventOrderByDate.distinctDate) === dateConvert(event.eventDate)) {
                        eventOrderByDate.eventsUnderDate.push({
                            id: event.id,
                            eventName: event.eventName,
                            eventTime: event.eventTime,
                            eventTimeInStandardHours: event.eventTimeInStandardHours,
                            eventDate: event.eventDate
                        });
                        dateExist = true;
                        return;
                    }
                });

                if (!dateExist) {
                    eventsOrderByDate.push({
                        distinctDate: event.eventDate,
                        eventsUnderDate: [{
                            id: event.id,
                            eventName: event.eventName,
                            eventTime: event.eventTime,
                            eventTimeInStandardHours: event.eventTimeInStandardHours,
                            eventDate: event.eventDate
                        }]
                    });
                }
            }
            //Display popup message
            pop(popupMessage);
            return eventsOrderByDate;
        };

    });
