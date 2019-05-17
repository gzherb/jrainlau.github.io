import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'

const API_DOMAIN = 'https://api.github.com'
const REPO_URL = `${API_DOMAIN}/repos/jrainlau/jrainlau.github.io`

const $fetch = ({ url, method = 'get', data, headers = {} }) => {
  return axios({
    url,
    method,
    data,
    headers: {
      'Authorization': localStorage.getItem('github_token'),
      ...headers
    }
  }).then(({ status, data }) => {
    return {
      status,
      data
    }
  }).catch(({ response }) => {
    return {
      status: response.status,
      data: response.data
    }
  })
}

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    articles: [],
    userInfo: {},
    keyword: ''
  },
  getters: {
    timeline ({ articles }) {
      const tl = {}
      articles.forEach(article => {
        const date = article.date.replace(/-\d{2}$/, '')
        if (!tl[date]) {
          tl[date] = []
        }
        tl[date].push(article)
      })
      return tl
    },
    labels ({ articles }) {
      const lb = {}
      articles.forEach(article => {
        article.labels.forEach(label => {
          if (!lb[label.name]) {
            lb[label.name] = {}
          }
          lb[label.name] = {
            color: label.color,
            name: label.name
          }
        })
      })
      return lb
    },
    articles ({ articles, keyword }) {
      let list = articles
      if (keyword) {
        const regx = new RegExp(keyword, 'i')
        list = articles.filter(article => regx.test(article.title))
      }
      return list
    }
  },
  mutations: {
    GET_ARTICLES (state, articles) {
      state.articles = articles
    },
    GET_USER_INFO (state, info) {
      Vue.set(state, 'userInfo', info)
    },
    GET_COMMENTS (state, { commentsUrl, comments }) {
      state.articles.forEach(article => {
        if (article.commentsUrl === commentsUrl) {
          Vue.set(article, 'comments', comments)
        }
      })
    },
    UPDATE_KEYWORD (state, keyword) {
      state.keyword = keyword
    },
    UPDATE_REACTIONS (state, { reactions, number }) {
      state.articles.forEach(article => {
        if (article.number === number) {
          Vue.set(article, 'reactions', {
            like: reactions.filter(re => re.content === 'heart'),
            praise: reactions.filter(re => re.content === '+1')
          })
        }
      })
    }
  },
  actions: {
    async getArticles ({ commit, dispatch }) {
      const { status, data } = await $fetch({
        url: `${REPO_URL}/issues?filter=created`
      }).catch(e => e)
      if (status < 400) {
        const articles = await Promise.all(data.map(async issue => {
          const cover = issue.body.match(/!\[.+?\]\((.+?[^)]*)\)/)

          const { data: reactions } = await dispatch('getReactions', {
            number: issue.number,
            autoCommit: false
          })

          const article = {
            title: issue.title,
            content: issue.body,
            cover: cover ? cover[1] : null,
            number: issue.number,
            date: new Date(issue.created_at).toLocaleDateString('zh').replace(/\//g, '-'),
            labels: issue.labels,
            commentsUrl: issue.comments_url,
            commentsAmount: issue.comments,
            reactions: {
              like: reactions.filter(re => re.content === 'heart'),
              praise: reactions.filter(re => re.content === '+1')
            }
          }
          return Promise.resolve(article)
        }))
        commit('GET_ARTICLES', articles)
        return true
      } else {
        return {
          status,
          message: data.message
        }
      }
    },
    async getUserInfo ({ commit }, token) {
      const { status, data } = await $fetch({
        url: `${API_DOMAIN}/user`,
        headers: {
          'Authorization': token
        }
      })
      if (status < 400) {
        commit('GET_USER_INFO', data)
      }
      return {
        status,
        data
      }
    },
    async getComments ({ commit }, commentsUrl) {
      const result = await $fetch({ url: commentsUrl })
      commit('GET_COMMENTS', { commentsUrl, comments: result.data })
      return result
    },
    async createComment ({ commit }, { commentsUrl, comment }) {
      const result = await $fetch({
        url: commentsUrl,
        method: 'post',
        data: {
          body: comment
        }
      })
      return result
    },
    async getReactions ({ commit }, { number, autoCommit }) {
      const result = await $fetch({
        url: `${REPO_URL}/issues/${number}/reactions`,
        headers: {
          'Accept': 'application/vnd.github.squirrel-girl-preview+json'
        }
      }).catch(e => e)
      autoCommit && commit('UPDATE_REACTIONS', {
        reactions: result.data,
        number
      })
      return result
    },
    async createAnReaction ({ dispatch }, { number, content }) {
      await $fetch({
        method: 'post',
        url: `${REPO_URL}/issues/${number}/reactions`,
        data: {
          content
        },
        headers: {
          'Accept': 'application/vnd.github.squirrel-girl-preview+json'
        }
      }).catch(e => e)
      dispatch('getReactions', { number, autoCommit: true })
    },
    async deleteAnReaction ({ dispatch }, { number, id }) {
      await $fetch({
        method: 'delete',
        url: `${API_DOMAIN}/reactions/${id}`,
        headers: {
          'Accept': 'application/vnd.github.squirrel-girl-preview+json'
        }
      }).catch(e => e)
      dispatch('getReactions', { number, autoCommit: true })
    }
  }
})
