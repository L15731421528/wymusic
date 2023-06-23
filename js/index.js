// 解决 click 事件的300ms延迟问题
FastClick.attach(document.body);

(async function () {
    const markImageBox = document.querySelector('.mark-image'),
        headerBox = document.querySelector('.header'),
        loadingBox = document.querySelector('.loading-box'),
        audioBox = document.querySelector('#audioBox'),
        wrapperBox = document.querySelector('.wrapper'),
        circle = document.querySelector('.circle'),
        innerPic = document.querySelector('.innerPic'),
        backPic = document.querySelector('.backPic')
    let wrapperList = [],
        timer = null,
        matchNum = 0 //记录历史匹配的数量



    const format = function format(time) {
        let minutes = Math.floor(time / 60),
            seconds = Math.round(time - minutes * 60)
        minutes = minutes < 10 ? '0' + minutes : '' + minutes
        seconds = seconds < 10 ? '0' + seconds : '' + seconds
        return {
            minutes,
            seconds
        }
    }
    const playend = function playend() {
        clearInterval(timer)
        timer = null
        // currentBox.innerHTML = '00:00'
        // alreadyBox.style.width = '0%'
        wrapperBox.style.transform = 'translateY(0)'
        // wrapperList.forEach(item => item.className = '')
        innerPic.style.display = 'block'

    }

    const handle = function handle() {
        let pH = wrapperList[0].offsetHeight
        let { currentTime, duration } = audioBox
        if (isNaN(currentTime) || isNaN(duration)) return
        // 播放结束
        if (currentTime >= duration) {
            playend()
            return
        }

        // 控制进度条
        let { minutes: currentTimeMinutes, seconds: currentTimeSeconds } = format(currentTime)
        // 控制歌词：查找和当前播放时间匹配的歌词段落
        let matchs = wrapperList.filter(item => {
            let minutes = item.getAttribute('minutes'),
                seconds = item.getAttribute('seconds')
            return minutes === currentTimeMinutes && seconds === currentTimeSeconds && item.className !== "active"
        })
        if (matchs.length > 0) {
            // // 让匹配的段落有选中样式，而其余的移除选中样式
            wrapperList.forEach(item => item.className = '')
            matchs.forEach(item => item.className = 'active')

            // 控制移动
            matchNum += matchs.length
            if (matchNum > 1) {
                let offset = (matchNum - 1) * pH
                wrapperBox.style.transform = `translateY(${-offset}px)`
            }
        }
    }
    headerBox.addEventListener('click', function () {
        if (audioBox.paused) {
            // 当前是暂停的：我们让其播放
            audioBox.play()
            handle()
            if (!timer) {
                timer = setInterval(handle, 1000)
            }

            backPic.className = 'backPic move'
            innerPic.style.display = 'none'
            return
        }
        // 当前是播放的：我们让其暂停
        audioBox.pause()
        backPic.className = 'backPic'
        innerPic.style.display = 'block'
        clearInterval(timer)
        timer = null
    })

    /* 绑定数据 */
    const bindLyric = function bindLyric(lyric) {
        // 处理歌词部分的特殊符号
        lyric = lyric.replace(/&#(\d+);/g, (value, $1) => {
            let instead = value
            switch (+$1) {
                case 32:
                    instead = " "
                    break
                case 40:
                    instead = "("
                    break
                case 41:
                    instead = ")"
                    break
                case 45:
                    instead = "-"
                    break
                default:
            }
            return instead
        })
        // 解析歌词信息
        let arr = []
        lyric.replace(/\[(\d+):(\d+).(?:\d+)\](.+)\n/g, (_, $1, $2, $3) => {
            arr.push({
                minutes: $1,
                seconds: $2,
                text: $3.trim()
            })
        })
        // 歌词绑定
        let str = ``
        arr.forEach(({ minutes, seconds, text }) => {
            str += `<p minutes="${minutes}" seconds="${seconds}">
                ${text}
            </p>`
        })
        wrapperBox.innerHTML = str
        // 获取所有的P标签
        wrapperList = Array.from(wrapperBox.querySelectorAll('p'))

    }
    const binding = function binding(data) {
        let { pic, audio, lyric } = data

        // @2 杂七杂八的信息
        markImageBox.style.backgroundImage = `url(${pic})`
        audioBox.src = audio
        // @3 绑定歌词信息
        bindLyric(lyric)
        // @4 关闭Loading效果
        loadingBox.style.display = 'none'
    }

    /* 向服务器发送请求，从服务器获取相关的数据 */
    try {
        let { code, data } = await API.queryLyric()
        if (+code === 0) {
            // 请求成功：网络层和业务层都成功
            binding(data)
            return
        }
    } catch (_) {
        console.log(_);
    }
    // 请求失败
    alert('网络繁忙，请刷新页面')
})();