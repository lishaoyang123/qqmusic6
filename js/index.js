// 解决 click 事件的300ms延迟问题
FastClick.attach(document.body);

(async function () {
    const lyricBox = document.querySelector('.lyric'),
        containerText = document.querySelector('.container-text'),
        textBox = containerText.querySelector('.textBox'),
        text = textBox.querySelector('p'),
        diskBox = document.querySelector('.disk'),
        spanBox = diskBox.querySelector('span')
    loadingBox = document.querySelector('.loading-box'),
        contentBox = document.querySelector('.content'),
        audioBox = document.querySelector('#audioBox')
    let wrapperList = [],
        timer = null,
        matchNum = 0 //记录历史匹配的数量

    /* 音乐控制 */
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
        textBox.style.transform = 'translateY(0)'
        matchNum = 0
        // console.log(wrapperList);
        spanBox.style.display = 'block'
        containerText.innerHTML = '作词：王裕宗/李安修'
        contentBox.className = 'content'
    }
    const handle = function handle() {
        spanBox.style.display = 'none'
        let pH = wrapperList[0].offsetHeight
        let { currentTime, duration } = audioBox
        if (isNaN(currentTime) || isNaN(duration)) return
        // 播放结束
        if (currentTime >= duration) {
            playend()
            return
        }

        // 控制进度条
        let { minutes: currentTimeMinutes, seconds: currentTimeSeconds } = format(currentTime),
            { minutes: durationMinutes, seconds: durationSeconds } = format(duration)

        //控制歌词：查找和当前播放时间匹配的歌词段落
        let matchs = wrapperList.filter(item => {
            let minutes = item.getAttribute('minutes'),
                seconds = item.getAttribute('seconds')
            return minutes === currentTimeMinutes && seconds === currentTimeSeconds
        })
        if (matchs.length > 0) {

            // 控制移动
            matchNum += matchs.length
            if (matchNum > 1) {
                containerText.innerHTML = matchs[matchs.length - 1].innerHTML
                let offset = (matchNum - 1) * pH
                textBox.style.transform = `translateY(${-offset}px)`
            }
        }
    }

    contentBox.addEventListener('click', function () {

        if (audioBox.paused) {
            // 当前是暂停的：我们让其播放
            audioBox.play()
            contentBox.className = 'content move'
            handle()

            if (!timer) timer = setInterval(handle, 1000)
            return
        }
        // 当前是播放的：我们让其暂停
        audioBox.pause()
        contentBox.className = 'content'
        spanBox.style.display = 'block'
        clearInterval(timer)
        timer = null
    })

    /* 绑定数据 */
    const bindLyric = function bindLyric(lyric) {

        // 解析歌词信息
        let arr = []
        lyric.replace(/\[(\d+):(\d+).(?:\d+)\](.+)\n/g,
            (_, $1, $2, $3) => {
                arr.push({
                    minutes: $1,
                    seconds: $2,
                    text: $3
                })
            }
        )


        // 歌词绑定
        let str = ''
        arr.forEach(({ minutes, seconds, text }) => {
            str += `
            <p class="text" minutes=${minutes} seconds=${seconds}>${text}</p> 
            `
        })
        textBox.innerHTML = str
        // 获取所有的P标签
        wrapperList = Array.from(textBox.querySelectorAll('p'))
    }
    const binding = function binding(data) {
        let { title, author, duration, pic, audio, lyric } = data

        // @2 杂七杂八的信息
        // durationBox.innerHTML = duration
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
    } catch (error) {
        console.log(error);
    }
    // 请求失败
    alert('网络繁忙，请刷新页面')
})();
