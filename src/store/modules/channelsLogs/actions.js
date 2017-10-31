export default function (Vue) {
    function getParams (state) {
        let params = {}
        if (state.limit) { params.count = state.limit }
        if (state.filter && state.sysFilter) {
            if (state.mode === 1) {
                params.filter = `${state.sysFilter}`
            }
            else {
                params.filter = `${state.sysFilter},${state.filter}`
            }
        }
        else if (state.sysFilter && !state.filter) { params.filter = `${state.sysFilter}`}
        else if (!state.sysFilter && state.filter) {
            if (state.mode === 0) {
                params.filter = `${state.filter}`
            }
        }
        if (state.from && !state.reverse) {
            if (state.mode) {
                state.from += 2000
            }
            params.from = Math.floor(state.from / 1000)
        }
        if (state.to) {
            if (state.mode) {
                state.to += 2000
            }
            params.to = Math.floor(state.to / 1000)
        }
        if (state.reverse) { params.reverse = state.reverse }
        return params
    }

    function getCols ({ state, commit, rootState }) {
        commit('setCols')
    }

    async function initTime({ state, commit, rootState }) {
        if (rootState.token && state.active) {
            try {
                let params = {
                   reverse: true,
                   count: 1,
                   fields: 'time'
                }
                let resp = await Vue.http.get(`${rootState.server}/gw/channels/${state.active}/logs`, {
                    params: {data: JSON.stringify(params)}
                })
                let data = await resp.json()
                commit('setDate', Math.round(data.result[0].time * 1000))
            }
            catch (e) { console.log(e) }
        }
    }

    async function get ({ state, commit, rootState }, preaction) {
        commit('reqStart')
        if (preaction) {
            let { name: preactionName, payload: preactionPayload } = preaction
            commit('clearMessages')
            commit(preactionName, preactionPayload)
        }
        if (rootState.token && state.active) {
            try {
                let resp = await Vue.http.get(`${rootState.server}/gw/channels/${state.active}/logs`, {
                    params: {data: JSON.stringify(getParams(state))}
                })
                let data = await resp.json()
                if (preaction) {
                    if (data.result.length) {
                        commit('setMessages', data.result)
                        commit('postaction')
                    }
                    else {
                        commit('postaction')
                        switch (preaction.name) { // logic for empty response after pagination scroll
                            case 'paginationPrev': {
                                commit('datePrev')
                                commit('paginationPrev')
                                await get({ state, commit, rootState })
                                commit('postaction')
                                break
                            }
                            case 'paginationNext': {
                                get({ state, commit, rootState }, { name: 'dateNext' })
                                commit('postaction')
                                break
                            }
                            default: {
                                commit('setMessages', data.result)
                                commit('postaction')
                            }
                        }
                    }
                }
                else {
                    commit('setMessages', data.result)
                }
            }
            catch (e) { console.log(e) }
        }
    }

    function pullingGet ({ state, commit, rootState }, delay) {
        if (state.timerId) {
            commit('clearTimer')
        }
        state.timerId = setInterval(() => { get({ state, commit, rootState }) }, delay)
    }

    return {
        get,
        pullingGet,
        initTime,
        getCols
    }
}