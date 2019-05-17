<template>
  <div class="view">
    <div class="article" v-if="article">
      <section class="article-title">
        <h1>{{article.title}}</h1>
        <div>
          <i class="fas fa-feather-alt"></i>
          <span>{{article.date}}</span>
          <span v-for="(label, i) in article.labels" :key="i" class="label" :style="`background: #${label.color}`">{{label.name}}</span>
        </div>
      </section>
      <section class="article-content markdown" v-html="$options.filters.markify(article.content)"></section>
      <section class="article-comments">
        <Comments :article="article" :userInfo="userInfo" />
      </section>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import marked from 'marked'
import hljs from 'highlight.js'
import Comments from '@/components/Comments'

const renderer = new marked.Renderer()
renderer.link = (href, title, text) => `<a target="_blank" href="${href}" title="${title}">${text}</a>`

marked.setOptions({
  highlight: function (code, lang) {
    let val = code
    if (lang) {
      val = hljs.highlight(lang, code).value
    }
    return val
  },
  sanitize: true
})

export default {
  components: { Comments },
  filters: {
    markify (str) {
      return marked(str, { renderer })
    }
  },
  computed: {
    ...mapState(['articles', 'userInfo']),
    article () {
      const queryNumber = Number(this.$route.query.number)
      return this.articles.filter(({ number }) => number === queryNumber)[0]
    }
  },
  mounted () {
    this.getArticleComments()
  },
  watch: {
    article (val) {
      this.getArticleComments()
    }
  },
  methods: {
    ...mapActions(['getComments']),
    getArticleComments () {
      if (!this.article) return
      const commentsUrl = this.article.commentsUrl
      this.getComments(commentsUrl)
    }
  }
}
</script>

<style lang="less" scoped>
@import '../assets/style/variables.less';

.article {
  width: 100%;
  max-width: 935px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: calc(@gapOuter * 3) 0 @gapOuter 0;
  box-sizing: border-box;
  background: #fff;
  &-title {
    margin-bottom: @gapOuter;
    width: 100%;
    h1 {
      font-size: 2.5rem;
      border: none;
      margin-top: 0;
      margin-bottom: @gapOuter;
    }
    div {
      font-size: 1.2rem;
      margin: 0;
      color: @monorFontColor;
      i {
        margin-right: @gapInner;
      }
    }
    .label {
      font-size: 1rem;
      padding: 2px 8px;
      border-radius: @borderRadius;
      margin-left: @gapInner;
      color: #fff;
    }
  }
  &-content {
    width: 100%;
    line-height: 1.5;
  }
  &-comments {
    width: 100%;
  }
}

@media only screen and (max-width: 450px) {
  .article {
    padding: calc(@gapOuter * 3) @gapOuter @gapOuter @gapOuter;
    &-content {
      font-size: 1.2rem;
    }
  }
}
</style>
