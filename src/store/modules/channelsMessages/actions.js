export default function (Vue) {
    function getParams (state) {
        let params = {}
        if (state.limit) { params.limit_count = state.limit }
        if (state.from) { params.curr_key = state.from }
        return params
    }

    async function getCols ({ state, commit, rootState }) {
        commit('reqStart')
        if (rootState.token && state.active) {
            try {
                let protocolIdResp = await Vue.http.get(`${rootState.server}/gw/channels/${state.active}`, {
                    params: {fields: 'protocol_id'}
                })
                let protocolIdData = await protocolIdResp.json()
                if (protocolIdData.result && protocolIdData.result[0].protocol_id) {
                    let colsResp = await Vue.http.get(`${rootState.server}/gw/protocols/${protocolIdData.result[0].protocol_id}`, {
                        params: {fields: 'message_parameters'}
                    })
                    let colsData = await colsResp.json()
                    let cols = []
                    colsData.result[0].message_parameters.forEach(col => {
                        cols.push({
                            name: col.name,
                            width: 150,
                            display: true,
                            description: col.info
                        })
                    })
                    commit('setCols', cols)
                }
            }
            catch (e) { console.log(e) }
        }
    }

    async function get ({ state, commit, rootState }) {
        commit('reqStart')
        if (!state.timerId) {
            commit('clearMessages')
        }
        if (rootState.token && state.active) {
            try {
                let resp = await Vue.http.get(`${rootState.server}/gw/channels/${state.active}/messages`, {
                    params: {data: JSON.stringify(getParams(state))}
                })
                let data = await resp.json()
                commit('setMessages', data.result)
                if (data.result.length) { commit('setFrom', data.next_key) }
                else { commit('setFrom', data.last_key) }
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
        getCols
    }

}