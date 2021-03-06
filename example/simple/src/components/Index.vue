<template>
  <q-layout ref="layout" view="hHh LpR lFf">
    <q-toolbar slot="header">
      <div v-if="items">{{items.length}}</div>
    </q-toolbar>
    <virtual-scroll-list
      v-if="filteredItems.length"
      :cols="cols"
      :items="filteredItems"
      :actions="actions"
      :date="date"
      :mode="mode"
      :viewConfig="viewConfig"
      :colsConfigurator="'toolbar'"
      :i18n="{from: 'FROM', to: 'TO'}"
      :filter="filter"
      @change:filter="filterChangeHandler"
      @change:pagination-prev="paginationPrevChangeHandler"
      @change:pagination-next="paginationNextChangeHandler"
      @change:date="dateChangeHandler"
      @change:date-prev="datePrevChangeHandler"
      @change:date-next="dateNextChangeHandler"
      @action="actionHandler"
      @change:mode="modeChange"
      @update:cols="updateColsHandler"
    >
    </virtual-scroll-list>
  </q-layout>
</template>

<script>
  import { QLayout, QToolbar } from 'quasar-framework'
  import { VirtualScrollList } from 'qvirtualscroll'
  import cols from '../data/cols.json'

  export default {
    data () {
      return {
        actions: [
          {
            icon: 'delete',
            label: 'delete',
            classes: 'text-grey-3',
            type: 'delete'
          },
          {
            icon: 'edit',
            label: 'edit',
            classes: '',
            type: 'edit'
          }
        ],
        cols: cols,
        items: [],
        filter: '',
        mode: 0,
        timerId: 0,
        date: Date.now(),
        currentVal: 1000,
        defaultLimit: 1000,
        viewConfig: {
          needShowMode: true,
          needShowPageScroll: 'right left',
          needShowDate: true,
          needShowFilter: true
        }
      }
    },
    computed: {
      filteredItems: {
        get () {
          return this.filter ? this.filterItems(this.filter) : this.items
        }
      }
    },
    methods: {
      generateItems () {
        let limit = this.defaultLimit
        let randVal = () => {
          let types = ['String', 'Number', 'Boolean'],
            currentType = types[Math.round(Math.random() * 2)]
          switch (currentType) {
            case 'String': {
              return `String#${this.currentVal}`
            }
            case 'Number': {
              return this.currentVal
            }
            case 'Boolean': {
              return this.currentVal % 2 ? 'true' : 'false'
            }
          }
        }
        for (let i = 0; i < limit; i++) {
          let item = this.cols.reduce((res, col) => {
            res[col.name] = randVal()
            return res
          }, {})
          item.timestamp = this.date + this.currentVal
          this.items.push(item)
          this.currentVal += 1
        }
      },
      filterItems (filter) {
        function getPartsOfFilter (filterString) {
          let filtersStringArr = filterString.split(',')

          return filtersStringArr.reduce((acc, filter) => {
            let parts = [],
              operation = ''
            if (filter.indexOf('!=') !== -1) {
              parts = filter.split('!=')
              operation = '!='
            }
            else if (filter.indexOf('<=') !== -1) {
              parts = filter.split('<=')
              operation = '<='
            }
            else if (filter.indexOf('>=') !== -1) {
              parts = filter.split('>=')
              operation = '>='
            }
            else if (filter.indexOf('=') !== -1) {
              parts = filter.split('=')
              operation = '='
            }
            else if (filter.indexOf('<') !== -1) {
              parts = filter.split('<')
              operation = '<'
            }
            else if (filter.indexOf('>') !== -1) {
              parts = filter.split('>')
              operation = '>'
            }
            else {
              parts = [filter, null]
              operation = 'exist'
            }
            if (operation) {
              acc.push({
                operation: operation,
                field: parts[0],
                value: parts[1]
              })
            }
            return acc
          }, [])
        }
        if (filter) {
          let filters = getPartsOfFilter(filter)
          return this.items.filter(message => {
            return filters.reduce((flag, filter) => {
              /* eslint-disable */
              switch (filter.operation) {
                case '!=': {
                  return flag && !!message[filter.field] && message[filter.field] != filter.value
                }
                case '<=': {
                  return flag && !!message[filter.field] && message[filter.field] <= filter.value
                }
                case '>=': {
                  return flag && !!message[filter.field] && message[filter.field] >= filter.value
                }
                case '=': {
                  return flag && !!message[filter.field] && message[filter.field] == filter.value
                }
                case '<': {
                  return flag && !!message[filter.field] && message[filter.field] < filter.value
                }
                case '>': {
                  return flag && !!message[filter.field] && message[filter.field] > filter.value
                }
                default: {
                  return flag && !!message[filter.field]
                }
              }
              /* eslint-enable */
            }, true)
          })
        }
      },
      filterChangeHandler (val) {
        if (this.filter !== val) {
          this.filter = val
        }
      },
      paginationPrevChangeHandler () {
        this.date = this.items[0].timestamp - this.defaultLimit
        this.currentVal -= this.defaultLimit
        this.items.length = 0
        this.generateItems()
      },
      paginationNextChangeHandler () {
        this.date = this.items[this.items.length - 1].timestamp + 1
        this.currentVal += 1
        this.items.length = 0
        this.generateItems()
      },
      dateChangeHandler (timestamp) {
        this.date = timestamp
        this.items.length = 0
        this.generateItems()
      },
      datePrevChangeHandler () {
        this.date -= 86400000
        this.items.length = 0
        this.generateItems()
      },
      dateNextChangeHandler () {
        this.date += 86400000
        this.items.length = 0
        this.generateItems()
      },
      actionHandler ({index, type, content}) {
        switch (type) {
          case 'delete': {
            this.deleteMessageHandler({index, content})
            break
          }
          case 'edit': {
            this.editMessageHandler({index, content})
            break
          }
        }
      },
      editMessageHandler ({index, content}) {
        alert(`edit item#${index}: ${JSON.stringify(content)}`)
      },
      deleteMessageHandler ({index, content}) {
        alert(`delete item #${index}: ${JSON.stringify(content)}`)
      },
      modeChange (val) {
        switch (val) {
          case 0: {
            if (this.timerId) {
              clearInterval(this.timerId)
              this.timerId = 0
            }
            this.mode = val
            this.items.length = 0
            this.generateItems()
            break
          }
          case 1: {
            this.mode = val
            this.items.length = 0
            this.generateItems()
            this.timerId = setInterval(this.generateItems, 2000)
            break
          }
        }
      },
      updateColsHandler (newCols) {
        this.cols = newCols
      }
    },
    components: {
      VirtualScrollList,
      QLayout,
      QToolbar
    },
    created () {
      this.generateItems()
    }
  }
</script>

<style>
</style>
