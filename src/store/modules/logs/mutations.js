export default function (Vue) {
    function getFromTo (val) {
        let now = val || Date.now(),
            from = now - (now % 86400000),
            to = from + 86400000
        return {from, to}
    }

    function setMessages (state, data) {
        if (data && data.length) {
            if (state.reverse) {
                data.reverse()
            }
            let messages = [...state.messages, ...data]
            if (state.limit && state.mode === 1 && messages.length >= state.limit) { // rt limiting
                messages = messages.slice((messages.length -1) - (state.limit - 1))
            }
            Vue.set(state, 'messages', messages)
        }
    }

    function clearMessages (state) {
        Vue.set(state, 'messages', [])
    }

    function setLimit (state, count) {
        Vue.set(state, 'limit', count)
    }

    function setFilter (state, value) {
        if (state.filter !== value) {
            Vue.set(state, 'filter', value)
        }
    }

    function setMode (state, mode) {
        switch (mode) {
            case 0: {
                if (state.timerId) {
                    clearInterval(state.timerId)
                    state.timerId = 0
                }
                let timeObj = state.from ? getFromTo(state.from) : getFromTo()
                state.from = timeObj.from
                state.to = timeObj.to
                state.messages = []
                break
            }
            case 1: {
                let now = Date.now() - state.delay - 6000
                state.from = now - (state.delay - 1000)
                state.to = now
                state.messages = []
                break
            }
        }
        Vue.set(state, 'mode', mode)
    }

    function setFrom (state, from) {
        Vue.set(state, 'from', from)
    }

    function setTo (state, to) {
        Vue.set(state, 'to', to)
    }

    function reqStart () {
        if (DEV) {
            console.log('Start Request Channels Logs')
        }
    }

    function clearTimer (state) {
        clearInterval(state.timerId)
        state.timerId = 0
    }

    function setReverse (state, val) {
        Vue.set(state, 'reverse', val)
    }

    function setDate (state, date) {
        let timeObj = getFromTo(date)
        state.from = timeObj.from
        state.to = timeObj.to
    }

    function dateNext (state) {
        let timeObj = getFromTo(state.from + 86400000)
        state.from = timeObj.from
        state.to = timeObj.to
    }

    function datePrev (state) {
        let timeObj = getFromTo(state.from - 86400000)
        state.from = timeObj.from
        state.to = timeObj.to
    }

    function paginationPrev (state, firstTimestamp) {
        state.reverse = true
        setSysFilter(state, `timestamp>=${state.from / 1000}`)
        if (firstTimestamp) {
            state.from = getFromTo(firstTimestamp).from
            state.to = firstTimestamp - 1000
        }
    }

    function paginationNext (state, lastTimestamp) {
        setSysFilter(state, `timestamp<=${state.to / 1000}`)
        if (lastTimestamp) {
            state.to = getFromTo(lastTimestamp).to
            state.from = lastTimestamp + 1000
        }
    }

    function postaction (state) {
        let timeObj = getFromTo(state.from)
        setFrom(state, timeObj.from)
        setTo(state, timeObj.to)
        if (state.reverse) { setReverse(state, false) }
        let timestampIndex = state.sysFilter.indexOf('timestamp'),
            sliceFromTo = (start, end) => string => `${start ? string.slice(0, start) : ''}${end ? string.slice(end) : ''}`
        if (timestampIndex === 0) {
            let commaIndex = state.sysFilter.indexOf(',', timestampIndex)
            commaIndex !== -1
                ? state.sysFilter = sliceFromTo(0, commaIndex + 1)(state.sysFilter)
                : state.sysFilter = ''
        }
        else if (timestampIndex > 0) {
            let commaIndex = state.sysFilter.indexOf(',', timestampIndex)
            commaIndex !== -1
                ? state.sysFilter = sliceFromTo(timestampIndex, commaIndex + 1)(state.sysFilter)
                : state.sysFilter = sliceFromTo(timestampIndex - 1)(state.sysFilter)
        }
    }

    function setSysFilter (state, filter) {
        if (state.sysFilter) {
            state.sysFilter += `,${filter}`
        }
        else {
            state.sysFilter = filter
        }
    }

    function clear (state) {
        if (state.timerId) {
            clearInterval(state.timerId)
            state.timerId = 0
        }
        clearMessages(state)
        state.filter = ''
        state.mode = null
        state.from = 0
        state.to = 0
        state.limit = 1000
        state.reverse = false
    }

    function setOrigin (state, origin) {
        Vue.set(state, 'origin', origin)
    }

    function setCols (state, cols) {
        if (cols) {
            Vue.set(state, 'cols', cols)
        }
        else {
            let defaultCols = [
                {
                    name: 'timestamp',
                    width: 100,
                    display: true,
                    description: 'Log event time'
                },
                {
                    name: 'event_code',
                    title: 'event',
                    width: 400,
                    display: true,
                    description: 'Log event code and description'
                },
                {
                    name: 'ident',
                    width: 150,
                    display: true,
                    description: 'Connected device\'s identification string'
                },
                {
                    name: 'msgs',
                    width: 85,
                    display: true,
                    description: 'Number of messages received'
                },
                {
                    name: 'recv',
                    width: 85,
                    display: true,
                    description: 'Number of bytes received'
                },
                {
                    name: 'send',
                    width: 85,
                    display: true,
                    description: 'Number of bytes sent'
                },
                {
                    name: 'source',
                    width: 150,
                    display: true,
                    description: 'Connected device\'s address'
                },
                {
                    name: 'host',
                    width: 150,
                    display: true,
                    description: 'IP address from which HTTP request was received'
                },
                {
                    name: 'duration',
                    width: 85,
                    display: true,
                    description: 'Connection duration in seconds'
                },
                {
                    name: 'transport',
                    width: 85,
                    display: true,
                    description: 'Connected device\'s transport: tcp, udp, http etc'
                }
            ]
            Vue.set(state, 'cols', defaultCols)
        }
    }

    function setDelay(state, delay) {
        Vue.set(state, 'delay', delay)
        let now = Date.now() - delay - 6000
        state.from = now - (delay - 1000)
        state.to = now
        state.messages = []
    }

    return {
        setMessages,
        clearMessages,
        setLimit,
        setFilter,
        setMode,
        setFrom,
        setTo,
        reqStart,
        clearTimer,
        setReverse,
        dateNext,
        datePrev,
        paginationPrev,
        paginationNext,
        setDate,
        postaction,
        clear,
        setOrigin,
        setSysFilter,
        setCols,
        setDelay
    }
}