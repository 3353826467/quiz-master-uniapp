<template>
  <view class="app-root">
    <!-- ==================== 首页 - 题库列表 ==================== -->
    <view v-show="state.currentView === 'home'" class="view">
      <view class="app-header">
        <view class="header-title">题库大师</view>
        <button class="header-btn" @click="showImport" aria-label="导入题库">
          <app-icon name="i0"></app-icon>
        </button>
      </view>
      <view class="content">
        <view class="search-bar">
          <app-icon name="i1"></app-icon>
          <input type="text" v-model="bankSearch" placeholder="搜索题库..." @input="filterBanks" />
        </view>
        <view id="bank-list" class="bank-list">
          <view v-for="bank in homeBanks" :key="bank.id" class="bank-card" @click="openBank(bank.id)">
            <view class="bank-card-header">
              <view class="bank-card-name">{{ bank.name }}</view>
              <button class="bank-card-menu" @click.stop="showBankMenu(bank.id)" aria-label="更多">
                <app-icon name="i2"></app-icon>
              </button>
            </view>
            <view v-if="bank.description" class="bank-card-desc">{{ bank.description }}</view>
            <view class="bank-card-stats">
              <view class="bank-card-stat">
                <app-icon name="i3"></app-icon>
                <span>{{ bank.questionCount }}题</span>
              </view>
              <view class="bank-card-stat">
                <app-icon name="i4"></app-icon>
                <span>掌握{{ bank.masteredCount }}</span>
              </view>
              <view class="bank-card-stat">
                <app-icon name="i5"></app-icon>
                <span>{{ formatTime(bank.updatedAt) }}</span>
              </view>
            </view>
          </view>
        </view>
        <view v-if="homeBanks.length === 0" class="empty-state">
          <app-icon name="i6"></app-icon>
          <view>还没有题库</view>
          <view class="empty-sub">{{ bankSearch ? '未找到匹配的题库' : '点击右上角导入按钮创建第一个题库' }}</view>
        </view>
      </view>
      <button class="fab" @click="showImport" aria-label="新建题库">
        <app-icon name="i7"></app-icon>
      </button>
    </view>

    <!-- ==================== 题库详情 ==================== -->
    <view v-show="state.currentView === 'bank-detail'" class="view">
      <view class="app-header">
        <button class="header-btn" @click="navigate('home')" aria-label="返回">
          <app-icon name="i8"></app-icon>
        </button>
        <view class="header-title">{{ currentBank ? currentBank.name : '题库详情' }}</view>
        <button class="header-btn" @click="showBankMenu(state.currentBankId)" aria-label="更多">
          <app-icon name="i9"></app-icon>
        </button>
      </view>
      <view class="content">
        <view class="bank-info-card">
          <view class="bank-info-stats">
            <view class="stat-item"><span class="stat-num">{{ currentBank ? currentBank.questions.length : 0 }}</span><span class="stat-label">题目</span></view>
            <view class="stat-item"><span class="stat-num">{{ studiedCount }}</span><span class="stat-label">已背</span></view>
            <view class="stat-item"><span class="stat-num">{{ masteredCount }}</span><span class="stat-label">已掌握</span></view>
          </view>
        </view>
        <view class="action-row">
          <button class="action-btn study" @click="startStudy()">
            <app-icon name="i10"></app-icon>
            <span>全部背题</span>
          </button>
          <button class="action-btn practice" @click="startPractice(false, '')">
            <app-icon name="i11"></app-icon>
            <span>全部刷题</span>
          </button>
        </view>
        <view class="bank-info-card" style="padding:14px 16px;">
          <view style="font-size:14px;font-weight:600;color:#fff;margin-bottom:10px;">按题型分别进行</view>
          <view v-for="sec in bankTypeSections" :key="sec.type" style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid rgba(255,255,255,0.2);">
            <view style="display:flex;align-items:center;gap:10px;min-width:0;">
              <span class="question-item-type" :class="sec.type" style="background:rgba(255,255,255,0.2);color:#fff;">{{ Storage.getQuestionTypeName(sec.type) }}</span>
              <span style="font-size:13px;color:#fff;">{{ sec.count }} 题</span>
            </view>
            <view style="display:flex;gap:8px;flex-shrink:0;">
              <button class="text-btn" style="color:#fff;" @click="startStudy(sec.type)">背题</button>
              <button class="text-btn" style="color:#fff;" @click="startPractice(false, sec.type)">刷题</button>
            </view>
          </view>
          <view v-if="bankTypeSections.length === 0" style="font-size:13px;color:rgba(255,255,255,0.8);">当前题库暂无可分类的题目</view>
        </view>
        <view class="section-header">
          <view class="section-title">题目列表</view>
          <view style="display:flex;gap:8px;align-items:center;">
            <button class="text-btn" @click="aiBatchGenerateExplanations(state.currentBankId, { onlyMissing: true })">AI补全解析</button>
            <button class="text-btn" @click="showAddQuestion()">+ 添加题目</button>
          </view>
        </view>
        <view class="question-list">
          <view v-for="(q, idx) in bankQuestions" :key="q.id" class="question-item">
            <view class="question-item-content" @click="showEditQuestion(state.currentBankId, q.id)">
              <span class="question-item-type" :class="q.type">{{ Storage.getQuestionTypeName(q.type) }}</span>
              <view class="question-item-text">{{ idx + 1 }}. {{ q.content }}</view>
              <view style="font-size:12px;color:var(--text-tertiary);margin-top:4px;">{{ q.explanation ? '已含解析' : '暂无解析' }}</view>
            </view>
            <view class="question-item-actions">
              <button @click.stop="aiGenerateQuestionExplanation(state.currentBankId, q.id)" aria-label="AI补解析">
                <app-icon name="i12"></app-icon>
              </button>
              <button @click.stop="deleteQuestion(state.currentBankId, q.id)" aria-label="删除">
                <app-icon name="i13"></app-icon>
              </button>
            </view>
          </view>
          <view v-if="bankQuestions.length === 0" class="empty-state">
            <view>暂无题目</view>
            <view class="empty-sub">点击"添加题目"或返回导入</view>
          </view>
        </view>
      </view>
    </view>

    <!-- ==================== 导入题库 ==================== -->
    <view v-show="state.currentView === 'import'" class="view">
      <view class="app-header">
        <button class="header-btn" @click="navigate('home')" aria-label="返回">
          <app-icon name="i8"></app-icon>
        </button>
        <view class="header-title">导入题库</view>
      </view>
      <view class="content">
        <view class="import-tabs">
          <button class="import-tab" :class="{ active: imp.tab === 'paste' }" @click="switchImportTab('paste')">粘贴文本</button>
          <button class="import-tab" :class="{ active: imp.tab === 'file' }" @click="switchImportTab('file')">导入文件</button>
        </view>

        <view v-show="imp.tab === 'paste'" class="import-panel active">
          <view class="form-group">
            <label class="form-label">题库名称</label>
            <input type="text" v-model="imp.bankName" class="form-input" placeholder="输入题库名称" />
          </view>
          <view class="form-group">
            <label class="form-label">题库描述（可选）</label>
            <input type="text" v-model="imp.bankDesc" class="form-input" placeholder="输入题库描述" />
          </view>
          <view class="form-group">
            <label class="form-label">题目内容</label>
            <textarea v-model="imp.text" class="form-textarea" placeholder="粘贴题目文本，支持自动识别题型&#10;&#10;示例格式：&#10;1. 题目内容？&#10;A. 选项A&#10;B. 选项B&#10;答案：A&#10;解析：解析内容"></textarea>
          </view>
          <view style="display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn-secondary" style="flex:1;min-width:140px;" @click="aiFormatImportText()">AI 识别排版</button>
            <button class="btn-secondary" style="flex:1;min-width:140px;" @click="handleImageUpload()">AI OCR 图片识题</button>
            <button class="btn-primary" style="flex:1;min-width:140px;" @click="previewImport()">预览解析结果</button>
          </view>
        </view>

        <view v-show="imp.tab === 'file'" class="import-panel" :class="{ active: imp.tab === 'file' }">
          <view class="form-group">
            <label class="form-label">题库名称</label>
            <input type="text" v-model="imp.fileBankName" class="form-input" placeholder="输入题库名称" />
          </view>
          <view class="file-upload-area" @click="handleFileUpload()">
            <app-icon name="i14"></app-icon>
            <view>点击选择文件</view>
            <view class="file-hint">支持 .txt / .docx / .pdf / .xlsx / .csv（小程序端支持 txt / csv）</view>
          </view>
          <view v-if="imp.fileTextShow" id="file-content-area">
            <view class="form-group">
              <label class="form-label">已提取文本预览</label>
              <textarea v-model="imp.fileText" class="form-textarea" placeholder="文档提取出的文本将显示在这里"></textarea>
            </view>
            <view class="file-hint" style="margin-bottom:12px;">{{ imp.parseStatus }}</view>
            <view style="display:flex;gap:10px;">
              <button class="btn-secondary" style="flex:1;" @click="aiFormatFileText()">AI 识别排版</button>
              <button class="btn-primary" style="flex:1;" @click="previewFileImport()">预览解析结果</button>
            </view>
          </view>
        </view>

        <view v-if="imp.previewShow" class="import-preview">
          <view class="preview-header">
            <view class="preview-title">{{ imp.previewTitle }}</view>
            <span class="preview-count">{{ imp.previewCount }}</span>
          </view>
          <view class="preview-list">
            <view v-for="(q, i) in imp.previewQuestions" :key="i" class="preview-item">
              <span class="preview-item-type" :class="q.type" style="display:inline-block;font-size:11px;padding:2px 8px;border-radius:4px;font-weight:500;margin-bottom:6px;">{{ Storage.getQuestionTypeName(q.type) }}</span>
              <view class="preview-item-q">{{ i + 1 }}. {{ q.content }}</view>
              <view v-if="q.options && q.options.length" style="font-size:13px;color:var(--text-secondary);margin-bottom:4px;">
                {{ q.options.map((o, j) => 'ABCDEFGH'[j] + '. ' + o).join('　') }}
              </view>
              <view class="preview-item-a">答案：{{ q.answer }}</view>
              <view v-if="q.explanation" style="font-size:12px;color:var(--text-tertiary);margin-top:2px;">解析：{{ q.explanation }}</view>
            </view>
          </view>
          <view class="import-actions">
            <button class="btn-secondary" @click="cancelImport()">取消</button>
            <button class="btn-primary" @click="confirmImport()">确认导入</button>
          </view>
        </view>
      </view>
    </view>

    <!-- ==================== 背题模式 ==================== -->
    <view v-show="state.currentView === 'study'" class="view">
      <view class="app-header">
        <button class="header-btn" @click="exitStudy()" aria-label="退出">
          <app-icon name="i15"></app-icon>
        </button>
        <view class="header-title">背题模式</view>
        <button class="header-btn" @click="toast('请在设置中调整背题选项')" aria-label="设置">
          <app-icon name="i16"></app-icon>
        </button>
      </view>
      <view class="content study-content">
        <view class="study-progress-bar">
          <view class="progress-info">
            <span>{{ study.index + 1 }} / {{ study.questions.length }}</span>
            <span>{{ studyProgress }}</span>
          </view>
          <view class="progress-track"><view class="progress-fill" :style="{ width: studyProgress }"></view></view>
        </view>
        <view class="flashcard-container">
          <view v-if="study.q" class="flashcard flashcard-static">
            <span class="question-type-badge" :class="study.q.type">{{ Storage.getQuestionTypeName(study.q.type) }}</span>
            <view class="flashcard-q">{{ study.q.content }}</view>
            <view v-if="study.q.options && study.q.options.length" class="study-options">
              <view v-for="(opt, i) in study.q.options" :key="i" class="study-option">
                <span style="font-weight:600;color:var(--primary);">{{ 'ABCDEFGHIJ'[i] }}.</span> {{ opt }}
              </view>
            </view>
            <view class="answer-label">正确答案</view>
            <view class="flashcard-answer">{{ study.q.answer }}</view>
            <view class="explanation-label">解析</view>
            <view class="flashcard-explanation">{{ study.q.explanation || '暂无解析' }}</view>
          </view>
        </view>
        <view class="study-controls">
          <button class="study-nav-btn" @click="prevStudyCard()" :disabled="study.index === 0" aria-label="上一题">
            <app-icon name="i8"></app-icon>
          </button>
          <button class="study-mark-btn" :class="{ marked: study.q && study.q.mastered }" @click="toggleMastered()">
            <app-icon name="i17"></app-icon>
            <span>{{ study.q && study.q.mastered ? '已掌握' : '标记掌握' }}</span>
          </button>
          <button class="study-nav-btn" @click="nextStudyCard()" :disabled="study.index >= study.questions.length - 1" aria-label="下一题">
            <app-icon name="i18"></app-icon>
          </button>
        </view>
      </view>
    </view>

    <!-- ==================== 刷题模式 ==================== -->
    <view v-show="state.currentView === 'practice'" class="view">
      <view class="app-header">
        <button class="header-btn" @click="exitPractice()" aria-label="退出">
          <app-icon name="i15"></app-icon>
        </button>
        <view class="header-title">刷题模式</view>
        <span class="header-score">{{ practice.score }}分</span>
      </view>
      <view class="content practice-content">
        <view class="practice-progress-bar">
          <view class="progress-info">
            <span>第 {{ practice.index + 1 }} 题 / 共 {{ practice.questions.length }} 题</span>
            <span>正确率 {{ practiceRate }}%</span>
          </view>
          <view class="progress-track"><view class="progress-fill" :style="{ width: practiceProgress }"></view></view>
        </view>
        <view v-if="practice.q" class="practice-card">
          <view class="practice-toolbar">
            <view style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span class="question-type-badge" :class="practice.q.type">{{ Storage.getQuestionTypeName(practice.q.type) }}</span>
              <span v-if="practice.favoriteMode" class="question-item-type single" style="display:inline-flex;">收藏练习</span>
            </view>
            <view class="practice-toolbar-actions">
              <button class="toolbar-chip" :class="{ active: practice.q.favorite }" @click="togglePracticeFavorite()">{{ practice.q.favorite ? '★ 已收藏' : '☆ 收藏' }}</button>
              <button class="toolbar-chip" :class="{ 'error-active': isInErrorBook }" @click="addCurrentToErrorBook()">{{ isInErrorBook ? '✓ 在错题本' : '＋ 错题本' }}</button>
              <button class="toolbar-chip" :class="{ saved: practiceSaved }" @click="savePracticeProgress(false)">💾 保存</button>
            </view>
          </view>
          <view class="practice-question">{{ practice.q.content }}</view>
          <view v-if="practice.q.type === 'single' || practice.q.type === 'multiple'" class="practice-options">
            <view
              v-for="opt in practice.optionsView"
              :key="opt.label"
              class="practice-option"
              :class="optionClass(opt.label)"
              @click="selectOption(opt.label)"
            >
              <span class="option-label">{{ opt.label }}</span>
              <span class="option-text">{{ opt.text }}</span>
            </view>
          </view>
          <view v-else-if="practice.q.type === 'truefalse'" class="practice-truefalse">
            <view class="practice-option" :class="tfClass('正确')" @click="selectTrueFalse('正确')">
              <span class="option-text">✓ 正确</span>
            </view>
            <view class="practice-option" :class="tfClass('错误')" @click="selectTrueFalse('错误')">
              <span class="option-text">✗ 错误</span>
            </view>
          </view>
          <view v-else class="practice-input-area">
            <textarea v-if="practice.q.type === 'shortanswer'" v-model="practice.textAnswer" class="practice-input" rows="4" placeholder="请输入答案" style="resize:vertical;"></textarea>
            <input v-else v-model="practice.textAnswer" class="practice-input" placeholder="请输入答案" />
            <view class="practice-session-tip">当前输入会在保存进度时保留</view>
          </view>
          <view v-if="practice.submitted" class="practice-feedback" :style="{ background: practice.feedback.correct ? 'var(--success-bg)' : 'var(--error-bg)' }">
            <view class="feedback-answer">
              <span class="feedback-label">正确答案：</span>
              <span class="practice-correct-answer">{{ practice.q.answer }}</span>
            </view>
            <view class="feedback-explanation">
              <span class="feedback-label">解析：</span>
              <span class="practice-explanation">{{ practice.feedback.correct ? (practice.q.explanation || '暂无解析') : (practice.q.explanation || '暂无解析') }}</span>
            </view>
            <view v-if="practice.feedback.userAnswer && !practice.feedback.correct" style="font-size:13px;color:var(--error);margin-top:4px;">你的答案：{{ practice.feedback.userAnswer }}</view>
            <view v-if="practice.feedback.aiReason" style="margin-top:8px;font-size:12px;color:var(--text-secondary);">AI 判分说明：{{ practice.feedback.aiReason }}{{ typeof practice.feedback.aiScore === 'number' ? '（评分 ' + Math.round(practice.feedback.aiScore * 100) + '%）' : '' }}</view>
          </view>
        </view>
        <view class="practice-controls practice-controls-top">
          <button class="btn-secondary practice-btn" :disabled="practice.index === 0" @click="practicePrev()">上一题</button>
          <button class="btn-secondary practice-btn" @click="practiceSkip()">跳过</button>
          <button v-show="!practice.submitted" class="btn-primary practice-btn" @click="practiceSubmit()">提交</button>
          <button v-show="practice.submitted" class="btn-primary practice-btn" @click="practiceNext()">下一题</button>
        </view>
        <view class="practice-controls practice-controls-bottom">
          <button class="btn-secondary practice-btn" @click="savePracticeProgress(true)">保存并退出</button>
          <button class="btn-primary practice-btn" :disabled="practice.index >= practice.questions.length - 1" @click="practiceNextDirect()">下一题</button>
        </view>
      </view>
    </view>

    <!-- ==================== 刷题结果 ==================== -->
    <view v-show="state.currentView === 'practice-result'" class="view">
      <view class="app-header"><view class="header-title">练习结果</view></view>
      <view class="content result-content">
        <view class="result-circle">
          <view v-if="!isMp" class="result-ring"><svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" fill="none" stroke="#e5e7eb" stroke-width="12"/>
            <circle class="result-circle-fill" cx="80" cy="80" r="70" fill="none" stroke="#6366f1" stroke-width="12" stroke-linecap="round" transform="rotate(-90 80 80)" stroke-dasharray="440" :stroke-dashoffset="result.offset"/>
          </svg></view><view v-else class="result-pct-wrap"><text class="result-pct">{{ result.score }}%</text></view>
          <view v-if="!isMp" class="result-score"><span class="result-score-num">{{ result.score }}</span><span class="result-score-unit">分</span></view>
        </view>
        <view class="result-stats">
          <view class="result-stat-item"><span class="result-stat-num">{{ result.total }}</span><span class="result-stat-label">总题数</span></view>
          <view class="result-stat-item correct"><span class="result-stat-num">{{ result.correct }}</span><span class="result-stat-label">答对</span></view>
          <view class="result-stat-item wrong"><span class="result-stat-num">{{ result.wrong }}</span><span class="result-stat-label">答错</span></view>
          <view class="result-stat-item skip"><span class="result-stat-num">{{ result.skip }}</span><span class="result-stat-label">跳过</span></view>
        </view>
        <view class="result-actions">
          <button class="btn-secondary" @click="navigate('home')">返回首页</button>
          <button class="btn-primary" @click="practiceWrongOnly()">只练错题</button>
        </view>
      </view>
    </view>

    <!-- ==================== 收藏夹 ==================== -->
    <view v-show="state.currentView === 'favorites'" class="view">
      <view class="app-header">
        <view class="header-title">收藏夹</view>
        <button class="header-btn" @click="startFavoritePractice()" aria-label="练习收藏题">
          <app-icon name="i19"></app-icon>
        </button>
      </view>
      <view class="content">
        <view class="error-filter-bar">
          <view class="form-hint" style="flex:1;margin-top:0;align-self:center;">汇总所有题库已收藏题目，可直接进入练习或取消收藏</view>
          <button class="btn-primary error-practice-btn" @click="startFavoritePractice()">练习收藏</button>
        </view>
        <view class="error-list">
          <view v-for="(item, i) in favoriteList" :key="item.bankId + item.question.id" class="error-item">
            <view class="error-item-header">
              <span class="error-item-bank">{{ item.bankName }}</span>
              <span class="question-item-type" :class="item.question.type">{{ Storage.getQuestionTypeName(item.question.type) }}</span>
            </view>
            <view class="error-item-q">{{ item.question.content }}</view>
            <view class="error-item-answer error-item-correct">答案：{{ item.question.answer }}</view>
            <view class="error-item-actions">
              <button @click="openBank(item.bankId)">查看题库</button>
              <button @click="removeFavorite(item.bankId, item.question.id)">取消收藏</button>
            </view>
          </view>
        </view>
        <view v-if="favoriteList.length === 0" class="empty-state">
          <app-icon name="i20"></app-icon>
          <view>暂无收藏题目</view>
          <view class="empty-sub">在刷题模式点击“收藏”后，会显示在这里</view>
        </view>
      </view>
    </view>

    <!-- ==================== 错题本 ==================== -->
    <view v-show="state.currentView === 'error-book'" class="view">
      <view class="app-header">
        <view class="header-title">错题本</view>
        <button class="header-btn" @click="clearAllErrors()" aria-label="清空">
          <app-icon name="i21"></app-icon>
        </button>
      </view>
      <view class="content">
        <view class="error-filter-bar">
          <picker class="filter-select" mode="selector" :range="errorFilterRange" range-key="label" :value="errorFilterIndex" @change="onErrorFilterChange">
            <view class="filter-select-inner">{{ errorFilterLabel }}</view>
          </picker>
          <button class="btn-primary error-practice-btn" @click="startErrorPractice()">练习错题</button>
        </view>
        <view class="error-list">
          <view v-for="e in errorList" :key="e.id" class="error-item">
            <view class="error-item-header">
              <span class="error-item-bank">{{ e.bankName }}</span>
              <span class="question-item-type" :class="e.question.type">{{ Storage.getQuestionTypeName(e.question.type) }}</span>
            </view>
            <view class="error-item-q">{{ e.question.content }}</view>
            <view class="error-item-answer error-item-wrong">你的答案：{{ e.wrongAnswer || '未作答' }}</view>
            <view class="error-item-answer error-item-correct">正确答案：{{ e.question.answer }}</view>
            <view class="error-item-actions">
              <button @click="removeError(e.id)">移除</button>
              <button @click="openBank(e.bankId)">查看题库</button>
            </view>
          </view>
        </view>
        <view v-if="errorList.length === 0" class="empty-state">
          <app-icon name="i22"></app-icon>
          <view>暂无错题</view>
          <view class="empty-sub">刷题时答错的题目会自动加入错题本</view>
        </view>
      </view>
    </view>

    <!-- ==================== 统计 ==================== -->
    <view v-show="state.currentView === 'stats'" class="view">
      <view class="app-header"><view class="header-title">学习统计</view></view>
      <view class="content">
        <view class="stats-overview">
          <view class="stat-card"><view class="stat-card-icon blue"><app-icon name="i23"></app-icon></view><view class="stat-card-info"><span class="stat-card-num">{{ stats.totalQuestions }}</span><span class="stat-card-label">总题目数</span></view></view>
          <view class="stat-card"><view class="stat-card-icon green"><app-icon name="i24"></app-icon></view><view class="stat-card-info"><span class="stat-card-num">{{ stats.totalMastered }}</span><span class="stat-card-label">已掌握</span></view></view>
          <view class="stat-card"><view class="stat-card-icon orange"><app-icon name="i25"></app-icon></view><view class="stat-card-info"><span class="stat-card-num">{{ stats.totalPracticed }}</span><span class="stat-card-label">累计刷题</span></view></view>
          <view class="stat-card"><view class="stat-card-icon red"><app-icon name="i26"></app-icon></view><view class="stat-card-info"><span class="stat-card-num">{{ stats.errorCount }}</span><span class="stat-card-label">错题数</span></view></view>
          <view class="stat-card"><view class="stat-card-icon blue"><app-icon name="i27"></app-icon></view><view class="stat-card-info"><span class="stat-card-num">{{ stats.overallRate }}%</span><span class="stat-card-label">综合正确率</span></view></view>
        </view>
        <view class="section-header"><view class="section-title">题库概览</view></view>
        <view class="stats-bank-list">
          <view v-for="b in stats.bankList" :key="b.id" class="stats-bank-item">
            <view class="stats-bank-name">{{ b.name }}</view>
            <view class="stats-bank-bar"><view class="stats-bank-bar-fill" :style="{ width: b.rate + '%' }"></view></view>
            <view class="stats-bank-info"><span>掌握 {{ b.masteredCount }}/{{ b.questionCount }}</span><span>{{ b.rate }}%</span></view>
            <view class="stats-bank-info" style="margin-top:6px;"><span>刷题 {{ b.practiced }} 次</span><span>正确率 {{ b.accuracy }}%</span></view>
          </view>
          <view v-if="stats.bankList.length === 0" class="empty-state"><view>暂无题库</view></view>
        </view>
        <view class="section-header"><view class="section-title">正确率趋势</view></view>
        <view class="stats-chart">
          <view v-if="stats.chartHasData" class="chart-bars">
            <view v-for="(h, i) in stats.chart" :key="i" class="chart-bar-col">
              <span class="chart-bar-val">{{ h.practiced > 0 ? h.rate + '%' : '-' }}</span>
              <view class="chart-bar" :style="{ height: (h.practiced > 0 ? Math.max(2, h.practiced / stats.chartMax * 100) : 2) + '%' }"></view>
              <span class="chart-bar-label">{{ h.label }}</span>
            </view>
          </view>
          <view v-else class="chart-empty">暂无刷题记录</view>
        </view>
      </view>
    </view>

    <!-- ==================== 设置 ==================== -->
    <view v-show="state.currentView === 'settings'" class="view">
      <view class="app-header"><view class="header-title">设置</view></view>
      <view class="content">
        <view class="settings-group">
          <view class="settings-group-title">学习设置</view>
          <view class="settings-item"><view class="settings-item-info"><span class="settings-item-label">背题乱序</span><span class="settings-item-desc">背题时随机打乱题目顺序</span></view><label class="switch"><input type="checkbox" v-model="settings.studyShuffle" @change="saveSettings"><span class="switch-slider"></span></label></view>
          <view class="settings-item"><view class="settings-item-info"><span class="settings-item-label">刷题乱序</span><span class="settings-item-desc">刷题时随机打乱题目顺序</span></view><label class="switch"><input type="checkbox" v-model="settings.practiceShuffle" @change="saveSettings"><span class="switch-slider"></span></label></view>
          <view class="settings-item"><view class="settings-item-info"><span class="settings-item-label">选项乱序</span><span class="settings-item-desc">刷题时随机打乱选项顺序</span></view><label class="switch"><input type="checkbox" v-model="settings.optionShuffle" @change="saveSettings"><span class="switch-slider"></span></label></view>
          <view class="settings-item"><view class="settings-item-info"><span class="settings-item-label">自动加入错题本</span><span class="settings-item-desc">答错时自动添加到错题本</span></view><label class="switch"><input type="checkbox" v-model="settings.autoError" @change="saveSettings"><span class="switch-slider"></span></label></view>
          <view class="settings-item"><view class="settings-item-info"><span class="settings-item-label">显示解析</span><span class="settings-item-desc">刷题时显示答案解析</span></view><label class="switch"><input type="checkbox" v-model="settings.showExplanation" @change="saveSettings"><span class="switch-slider"></span></label></view>
        </view>
        <view class="settings-group">
          <view class="settings-group-title">AI 设置</view>
          <view class="settings-item"><view class="settings-item-info"><span class="settings-item-label">启用 AI 功能</span><span class="settings-item-desc">用于题目识别排版、AI 解析和补全</span></view><label class="switch"><input type="checkbox" v-model="settings.aiEnabled" @change="saveSettings"><span class="switch-slider"></span></label></view>
          <view class="form-group"><label class="form-label">AI Base URL</label><input type="text" v-model="settings.aiBaseUrl" class="form-input" placeholder="例如：https://api.openai.com/v1" @blur="saveSettings"></view>
          <view class="form-group"><label class="form-label">AI API Key</label><input type="text" v-model="settings.aiApiKey" class="form-input" placeholder="输入你的 API Key" @blur="saveSettings"></view>
          <view class="form-group"><label class="form-label">AI 模型</label><input type="text" v-model="settings.aiModel" class="form-input" placeholder="例如：gpt-4o-mini" @blur="saveSettings"></view>
          <view style="display:flex;gap:10px;margin-bottom:14px;"><button class="btn-secondary" style="flex:1;" @click="testAiConnection()">测试 AI 接口</button></view>
          <view class="form-hint" style="margin-bottom:12px;">{{ aiTestResult }}</view>
          <view class="settings-item"><view class="settings-item-info"><span class="settings-item-label">导入时优先用 AI</span><span class="settings-item-desc">先用 AI 识别题目结构与排版，再导入</span></view><label class="switch"><input type="checkbox" v-model="settings.aiUseForImport" @change="saveSettings"><span class="switch-slider"></span></label></view>
          <view class="settings-item"><div class="settings-item-info"><span class="settings-item-label">允许 AI 生成解析</span><span class="settings-item-desc">题目无解析时可自动补全解析</span></div><label class="switch"><input type="checkbox" v-model="settings.aiUseForExplanation" @change="saveSettings"><span class="switch-slider"></span></label></view>
          <view class="settings-item"><div class="settings-item-info"><span class="settings-item-label">导入后批量补全解析</span><span class="settings-item-desc">导入成功后自动为无解析题补齐 AI 解析</span></div><label class="switch"><input type="checkbox" v-model="settings.aiAutoExplainAfterImport" @change="saveSettings"><span class="switch-slider"></span></label></view>
          <view class="settings-item"><div class="settings-item-info"><span class="settings-item-label">主观题 AI 判分</span><span class="settings-item-desc">填空题/简答题启用语义判分</span></div><label class="switch"><input type="checkbox" v-model="settings.aiUseForSubjectiveGrading" @change="saveSettings"><span class="switch-slider"></span></label></view>
          <view class="settings-item"><div class="settings-item-info"><span class="settings-item-label">AI 失败自动回退</span><span class="settings-item-desc">AI 出错时回退到普通解析</span></div><label class="switch"><input type="checkbox" v-model="settings.aiAutoFallback" @change="saveSettings"><span class="switch-slider"></span></label></view>
        </view>
        <view class="settings-group">
          <view class="settings-group-title">数据管理</view>
          <view class="settings-item clickable" @click="exportData()"><div class="settings-item-info"><span class="settings-item-label">导出数据</span><span class="settings-item-desc">导出所有题库数据为文件</span></div><app-icon name="i28"></app-icon></view>
          <view class="settings-item clickable" @click="importData()"><div class="settings-item-info"><span class="settings-item-label">导入数据</span><span class="settings-item-desc">从备份文件恢复数据</span></div><app-icon name="i28"></app-icon></view>
          <view class="settings-item clickable danger" @click="clearAllData()"><div class="settings-item-info"><span class="settings-item-label">清空所有数据</span><span class="settings-item-desc">删除所有题库和记录</span></div><app-icon name="i28"></app-icon></view>
        </view>
        <view class="app-info"><view>题库大师 v1.0.0</view><view>智能刷题背题神器</view></view>
      </view>
    </view>

    <!-- ==================== 编辑题目 ==================== -->
    <view v-show="state.currentView === 'edit-question'" class="view">
      <view class="app-header">
        <button class="header-btn" @click="cancelEditQuestion()" aria-label="取消">
          <app-icon name="i15"></app-icon>
        </button>
        <view class="header-title">{{ edit.title }}</view>
        <button class="header-btn" @click="saveQuestion()" aria-label="保存">
          <app-icon name="i29"></app-icon>
        </button>
      </view>
      <view class="content">
        <view class="form-group">
          <label class="form-label">题型</label>
          <picker class="form-input" mode="selector" :range="editTypeRange" range-key="label" :value="editTypeIndex" @change="onEditTypePickerChange">
            <view class="form-input-inner">{{ editTypeLabel }}</view>
          </picker>
        </view>
        <view class="form-group">
          <label class="form-label">题目内容</label>
          <textarea v-model="edit.content" class="form-textarea" placeholder="输入题目内容"></textarea>
        </view>
        <view v-if="edit.type === 'single' || edit.type === 'multiple'">
          <label class="form-label">选项</label>
          <view v-for="(opt, i) in edit.options" :key="i" class="option-edit-row">
            <span class="option-edit-label">{{ 'ABCDEFGHIJ'[i] }}</span>
            <input type="text" v-model="edit.options[i]" class="option-edit-input" placeholder="选项内容" />
            <button class="option-remove-btn" @click="removeEditOption(i)" aria-label="删除选项">
              <app-icon name="i30"></app-icon>
            </button>
          </view>
          <button class="add-option-btn" @click="addOption()">+ 添加选项</button>
        </view>
        <view class="form-group">
          <label class="form-label">正确答案</label>
          <input type="text" v-model="edit.answer" class="form-input" placeholder="输入正确答案" />
          <view class="form-hint">{{ edit.answerHint }}</view>
        </view>
        <view class="form-group">
          <label class="form-label">解析（可选）</label>
          <textarea v-model="edit.explanation" class="form-textarea" placeholder="输入解析内容"></textarea>
        </view>
        <view style="display:flex;gap:10px;">
          <button class="btn-secondary" style="flex:1;" @click="aiGenerateExplanation()">AI 生成解析</button>
          <button class="btn-secondary" style="flex:1;" @click="aiFormatCurrentQuestion()">AI 识别题目</button>
        </view>
      </view>
    </view>

    <!-- ==================== 底部导航 ==================== -->
    <view v-show="showNav" class="bottom-nav">
      <button class="nav-item" :class="{ active: state.currentView === 'home' }" @click="navigate('home')">
        <app-icon name="i31"></app-icon>
        <span>题库</span>
      </button>
      <button class="nav-item" :class="{ active: state.currentView === 'favorites' }" @click="navigate('favorites')">
        <app-icon name="i32"></app-icon>
        <span>收藏夹</span>
      </button>
      <button class="nav-item" :class="{ active: state.currentView === 'error-book' }" @click="navigate('error-book')">
        <app-icon name="i33"></app-icon>
        <span>错题本</span>
      </button>
      <button class="nav-item" :class="{ active: state.currentView === 'stats' }" @click="navigate('stats')">
        <app-icon name="i34"></app-icon>
        <span>统计</span>
      </button>
      <button class="nav-item" :class="{ active: state.currentView === 'settings' }" @click="navigate('settings')">
        <app-icon name="i35"></app-icon>
        <span>设置</span>
      </button>
    </view>

    <!-- ==================== 模态框 ==================== -->
    <view v-if="modal.open" class="modal-overlay" @click="closeModal">
      <view class="modal-content" @click.stop>
        <template v-if="modal.type === 'confirm'">
          <view class="modal-header">{{ modal.title }}</view>
          <view class="modal-body"><view style="font-size:15px;line-height:1.6;color:var(--text-secondary);">{{ modal.message }}</view></view>
          <view class="modal-actions">
            <button class="btn-secondary" @click="closeModal">取消</button>
            <button class="btn-primary" style="background:var(--error);" @click="confirmModal">确定</button>
          </view>
        </template>
        <template v-else-if="modal.type === 'prompt'">
          <view class="modal-header">{{ modal.title }}</view>
          <view class="modal-body">
            <view style="font-size:14px;color:var(--text-secondary);margin-bottom:10px;">{{ modal.message }}</view>
            <input type="text" v-model="modal.promptValue" class="modal-input" />
          </view>
          <view class="modal-actions">
            <button class="btn-secondary" @click="closeModal">取消</button>
            <button class="btn-primary" @click="confirmModal">确定</button>
          </view>
        </template>
        <template v-else-if="modal.type === 'menu'">
          <view class="modal-header">{{ modal.title }}</view>
          <view v-for="(item, i) in modal.items" :key="i" class="modal-item" :class="{ danger: item.danger }" @click="item.action">
            <span v-html="item.icon || ''"></span><span>{{ item.label }}</span>
          </view>
          <view class="modal-cancel" @click="closeModal">取消</view>
        </template>
      </view>
    </view>

    <!-- ==================== 云同步 / 账户 ==================== -->
    <view v-if="isCloudAvailable()" class="cloud-badge-wrap">
      <view v-if="!auth.user" class="cloud-badge" @click="openLogin">
        <text class="cloud-badge-text">登录同步</text>
      </view>
      <view v-else class="cloud-badge cloud-badge-user" @click="openAccount">
        <text class="cloud-badge-text">{{ auth.user.email }}</text>
        <text class="cloud-badge-dot" :class="sync.status">{{ syncStatusText }}</text>
      </view>
    </view>

    <view v-if="auth.view !== 'closed'" class="cloud-modal-mask" @click.self="closeAuth">
      <view class="cloud-modal">
        <template v-if="auth.view === 'account'">
          <view class="cloud-modal-title">账户</view>
          <view class="cloud-account-email">{{ auth.user ? auth.user.email : '' }}</view>
          <view class="cloud-sync-row">
            <text>同步状态：</text>
            <text class="cloud-sync-state" :class="sync.status">{{ syncStatusText }}</text>
          </view>
          <button class="btn-primary" @click="doSyncNow">立即同步</button>
          <button class="btn-secondary cloud-logout" @click="doLogout">退出登录</button>
        </template>
        <template v-else>
          <view class="cloud-modal-title">登录 / 注册</view>
          <view v-if="auth.view !== 'forgot'" class="cloud-tabs">
            <button class="cloud-tab" :class="{ active: auth.mode === 'password' }" @click="switchMode('password')">密码登录</button>
            <button class="cloud-tab" :class="{ active: auth.mode === 'otp' }" @click="switchMode('otp')">验证码</button>
          </view>
          <input type="email" v-model="auth.email" class="form-input" placeholder="邮箱" />
          <input v-if="auth.view !== 'forgot' && auth.mode === 'password'" type="password" v-model="auth.password" class="form-input" placeholder="密码" />
          <input v-if="auth.view !== 'forgot' && auth.mode === 'otp' && auth.isRegister" type="password" v-model="auth.signupPassword" class="form-input" placeholder="设置密码（新账号）" />
          <input v-if="auth.view !== 'forgot' && auth.mode === 'otp' && pendingCodeSent" type="text" v-model="auth.code" class="form-input" placeholder="邮箱验证码" />
          <view v-if="auth.error" class="cloud-error">{{ auth.error }}</view>
          <button class="btn-primary" :disabled="auth.loading" @click="onPrimaryAction">{{ primaryBtnText }}</button>
          <view class="cloud-links">
            <text v-if="auth.view !== 'forgot' && auth.mode === 'otp' && !auth.isRegister" @click="auth.isRegister = true">注册新账号</text>
            <text v-if="auth.view !== 'forgot' && auth.mode === 'otp' && auth.isRegister" @click="auth.isRegister = false">已有账号？去登录</text>
            <text v-if="auth.view !== 'forgot'" @click="auth.view = 'forgot'">忘记密码</text>
            <text v-if="auth.view === 'forgot'" @click="auth.view = 'login'">返回登录</text>
          </view>
        </template>
        <button class="cloud-modal-close" @click="closeAuth">关闭</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import Storage from '@/common/storage.js'
import Parser from '@/common/parser.js'
import AiService from '@/common/ai.js'
import FileParser from '@/common/fileparser.js'
import { chooseDocument, readTextContent, readArrayBuffer, readImageBase64, getPlatform } from '@/common/platform.js'
import { toast, formatTime, shuffle, saveTextFile } from '@/common/format.js'
import AppIcon from '@/components/AppIcon.vue'
import {
  isCloudAvailable,
  getCurrentUser,
  onAuthStateChange,
  signInWithPassword,
  sendEmailCode,
  verifyEmailCode,
  resetPasswordForEmail,
  signOut
} from '@/common/cloud.js'

const TAB_VIEWS = ['home', 'favorites', 'error-book', 'stats', 'settings']

// 当前是否运行在微信小程序端（用于条件渲染：SVG 图标在小程序端降级为 emoji）
const isMp = ref(getPlatform() === 'mp-weixin')

const state = reactive({
  currentView: 'home',
  currentBankId: '',
  currentPracticeType: '',
  currentStudyType: '',
  previewQuestions: [],
  lastImportedFileType: '',
  lastImportedImageName: ''
})

const bankSearch = ref('')
const bankList = ref([])
const currentBank = ref(null)
const favoriteList = ref([])
const errorList = ref([])
const errorFilterBank = ref('')
const aiTestResult = ref('')
const practiceSaved = ref(false)

const settings = reactive({
  studyShuffle: true,
  practiceShuffle: true,
  optionShuffle: false,
  autoError: true,
  showExplanation: true,
  aiEnabled: false,
  aiBaseUrl: 'https://api.openai.com/v1',
  aiApiKey: '',
  aiModel: 'gpt-4o-mini',
  aiUseForImport: true,
  aiUseForExplanation: true,
  aiAutoExplainAfterImport: false,
  aiUseForSubjectiveGrading: true,
  aiAutoFallback: true
})

const study = reactive({ questions: [], index: 0, q: null })
const practice = reactive({
  questions: [],
  index: 0,
  q: null,
  answers: {},
  results: [],
  score: 0,
  submitted: false,
  feedback: { correct: false, userAnswer: '', aiReason: '', aiScore: '' },
  selection: '',
  multi: [],
  textAnswer: '',
  optionsView: [],
  mode: 'normal',
  wrongOnly: false,
  favoriteMode: false,
  errorPractice: false,
  bankMap: {},
  sessionKey: '',
  submitting: false
})
const result = reactive({ total: 0, correct: 0, wrong: 0, skip: 0, score: 0, offset: 440 })

const imp = reactive({
  tab: 'paste',
  bankName: '',
  bankDesc: '',
  text: '',
  fileBankName: '',
  fileText: '',
  fileTextShow: false,
  parseStatus: '',
  previewShow: false,
  previewTitle: '',
  previewCount: '',
  previewQuestions: [],
  pkgMode: false,
  existingBankId: ''
})

const edit = reactive({
  id: null,
  type: 'single',
  content: '',
  answer: '',
  explanation: '',
  options: ['', '', '', ''],
  title: '添加题目',
  answerHint: ''
})

const modal = reactive({ open: false, type: '', title: '', message: '', items: [], promptValue: '', onConfirm: null })

// ==================== 计算属性 ====================
const showNav = computed(() => TAB_VIEWS.includes(state.currentView))
const homeBanks = computed(() => {
  if (!bankSearch.value) return bankList.value
  const kw = bankSearch.value.toLowerCase()
  return bankList.value.filter((b) => b.name.toLowerCase().includes(kw) || (b.description && b.description.toLowerCase().includes(kw)))
})
const bankQuestions = computed(() => (currentBank.value ? currentBank.value.questions : []))
const studiedCount = computed(() => (currentBank.value ? currentBank.value.questions.filter((q) => q.studied).length : 0))
const masteredCount = computed(() => (currentBank.value ? currentBank.value.questions.filter((q) => q.mastered).length : 0))
const bankTypeSections = computed(() => {
  if (!currentBank.value) return []
  const types = ['single', 'multiple', 'truefalse', 'fillblank', 'shortanswer']
  return types
    .map((type) => ({ type, count: currentBank.value.questions.filter((q) => q.type === type).length }))
    .filter((item) => item.count > 0)
})
const studyProgress = computed(() => (study.questions.length ? ((study.index + 1) / study.questions.length) * 100 : 0).toFixed(0) + '%')
const practiceProgress = computed(() => (practice.questions.length ? (practice.index / practice.questions.length) * 100 : 0).toFixed(0) + '%')
const practiceRate = computed(() => {
  const answered = practice.results.length
  if (!answered) return 0
  const correct = practice.results.filter((r) => r.correct).length
  return Math.round((correct / answered) * 100)
})
const isInErrorBook = computed(() => {
  if (!practice.q) return false
  const bankId = practice.bankMap[practice.q.id] || state.currentBankId
  return Storage.getErrorBook().some((e) => e.bankId === bankId && e.questionId === practice.q.id)
})
const errorBankOptions = computed(() => bankList.value)
// 错题筛选下拉（用 picker 替代 select，以兼容微信小程序端）
const errorFilterRange = computed(() =>
  [{ label: '全部题库', id: '' }].concat(errorBankOptions.value.map((b) => ({ label: b.name, id: b.id })))
)
const errorFilterIndex = computed(() => {
  const idx = errorFilterRange.value.findIndex((o) => o.id === errorFilterBank.value)
  return idx < 0 ? 0 : idx
})
const errorFilterLabel = computed(() => (errorFilterRange.value[errorFilterIndex.value] || {}).label || '全部题库')
// 编辑题目时题型选择（picker 替代 select，兼容小程序端）
const editTypeRange = [
  { label: '单选题', value: 'single' },
  { label: '多选题', value: 'multiple' },
  { label: '判断题', value: 'truefalse' },
  { label: '填空题', value: 'fillblank' },
  { label: '简答题', value: 'shortanswer' }
]
const editTypeIndex = computed(() => {
  const idx = editTypeRange.findIndex((o) => o.value === edit.type)
  return idx < 0 ? 0 : idx
})
const editTypeLabel = computed(() => (editTypeRange[editTypeIndex.value] || {}).label || edit.type)
const stats = reactive({
  totalQuestions: 0,
  totalMastered: 0,
  totalPracticed: 0,
  errorCount: 0,
  overallRate: 0,
  bankList: [],
  chart: [],
  chartMax: 1,
  chartHasData: false
})

// ==================== 云端登录 / 同步 ====================
const auth = reactive({
  view: 'closed', // closed | login | account | forgot
  mode: 'password', // password | otp
  isRegister: false,
  email: '',
  password: '',
  signupPassword: '',
  code: '',
  loading: false,
  error: ''
})
const pendingCodeSent = ref(false)
const sync = reactive({ status: 'idle', message: '' }) // idle | syncing | synced | error | local

const syncStatusText = computed(() => {
  if (sync.status === 'syncing') return '同步中…'
  if (sync.status === 'synced') return '已同步'
  if (sync.status === 'error') return '同步失败'
  if (sync.status === 'local') return '仅本地'
  return '未同步'
})
const primaryBtnText = computed(() => {
  if (auth.view === 'forgot') return '发送重置邮件'
  if (auth.loading) return '处理中…'
  if (auth.mode === 'password') return '登录'
  if (auth.mode === 'otp' && !pendingCodeSent.value) return '获取验证码'
  if (auth.mode === 'otp' && pendingCodeSent.value) return '验证并登录/注册'
  return '确定'
})

function openLogin() {
  auth.view = 'login'
  auth.error = ''
}
function openAccount() {
  auth.view = 'account'
}
function closeAuth() {
  if (auth.loading) return
  auth.view = 'closed'
  auth.error = ''
}
function switchMode(m) {
  auth.mode = m
  auth.error = ''
  pendingCodeSent.value = false
}
async function doPasswordLogin() {
  if (!auth.email || !auth.password) { auth.error = '请输入邮箱和密码'; return }
  auth.loading = true
  auth.error = ''
  const { data, error } = await signInWithPassword(auth.email.trim(), auth.password)
  auth.loading = false
  if (error) { auth.error = error.message || '登录失败'; return }
  await onLoginSuccess(data.user)
}
async function doSendCode() {
  if (!auth.email) { auth.error = '请输入邮箱'; return }
  auth.loading = true
  auth.error = ''
  const sent = await sendEmailCode(auth.email.trim())
  auth.loading = false
  if (sent.error) { auth.error = sent.error.message || '发送失败'; return }
  pendingCodeSent.value = true
  toast('验证码已发送到邮箱')
}
async function doVerifyCode() {
  if (!auth.code) { auth.error = '请输入验证码'; return }
  auth.loading = true
  auth.error = ''
  const pwd = auth.isRegister && auth.mode === 'otp' ? auth.signupPassword : undefined
  const completed = await verifyEmailCode(auth.email.trim(), auth.code.trim(), pwd)
  auth.loading = false
  if (completed.error) { auth.error = completed.error.message || '验证失败'; return }
  await onLoginSuccess(completed.data.user)
}
async function doForgot() {
  if (!auth.email) { auth.error = '请输入邮箱'; return }
  auth.loading = true
  auth.error = ''
  const res = await resetPasswordForEmail(auth.email.trim())
  auth.loading = false
  if (res.error) { auth.error = res.error.message || '请求失败'; return }
  toast('密码重置邮件已发送，请查收')
  auth.view = 'login'
  auth.isRegister = false
}
async function onLoginSuccess(user) {
  auth.user = user
  auth.view = 'closed'
  auth.error = ''
  pendingCodeSent.value = false
  Storage.setCloudSync(true)
  sync.status = 'syncing'
  const r = await Storage.pullFromCloud()
  if (r.ok) {
    sync.status = 'synced'
    refreshAll()
  } else {
    sync.status = 'error'
    sync.message = r.error || '同步失败'
  }
}
async function doSyncNow() {
  if (!auth.user) { openLogin(); return }
  sync.status = 'syncing'
  const r = await Storage.pullFromCloud()
  if (r.ok) { sync.status = 'synced'; refreshAll() }
  else { sync.status = 'error' }
}
async function doLogout() {
  auth.loading = true
  await signOut()
  auth.loading = false
  auth.user = null
  Storage.setCloudSync(false)
  sync.status = 'local'
  auth.view = 'closed'
  toast('已退出登录')
}
function onPrimaryAction() {
  if (auth.view === 'forgot') { doForgot(); return }
  if (auth.mode === 'password') doPasswordLogin()
  else if (auth.mode === 'otp' && !pendingCodeSent.value) doSendCode()
  else if (auth.mode === 'otp' && pendingCodeSent.value) doVerifyCode()
}
async function initAuth() {
  if (!isCloudAvailable()) { sync.status = 'local'; return }
  const user = await getCurrentUser()
  if (user) {
    auth.user = user
    Storage.setCloudSync(true)
    sync.status = 'syncing'
    const r = await Storage.pullFromCloud()
    sync.status = r.ok ? 'synced' : 'error'
    refreshAll()
  } else {
    sync.status = 'local'
  }
  onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      auth.user = null
      Storage.setCloudSync(false)
      sync.status = 'local'
    }
  })
}
function refreshAll() {
  refreshHome()
  refreshFavorites()
  refreshErrorBook()
  refreshStats()
}

// ==================== 导航 ====================
function navigate(viewName) {
  state.currentView = viewName
  if (viewName === 'home') refreshHome()
  else if (viewName === 'favorites') refreshFavorites()
  else if (viewName === 'error-book') refreshErrorBook()
  else if (viewName === 'stats') refreshStats()
  else if (viewName === 'settings') refreshSettings()
}

function filterBanks() {
  // 仅触发 computed homeBanks 重新计算，无需额外处理
}

// ==================== 首页 ====================
function refreshHome() {
  bankList.value = Storage.getAllBanks()
}

async function openBank(bankId) {
  state.currentBankId = bankId
  currentBank.value = Storage.getBank(bankId)
  if (!currentBank.value) {
    toast('题库不存在')
    return
  }
  navigate('bank-detail')
}

// ==================== 题库菜单 ====================
function showBankMenu(bankId) {
  state.currentBankId = bankId
  const bank = Storage.getBank(bankId)
  if (!bank) return
  modal.type = 'menu'
  modal.title = '题库操作'
  modal.items = [
    { label: '重命名', action: () => { closeModal(); renameBank(bankId) } },
    { label: '编辑描述', action: () => { closeModal(); editBankDesc(bankId) } },
    { label: '追加题目', action: () => { closeModal(); addQuestionsToBank(bankId) } },
    { label: '导出互通包', action: () => { closeModal(); exportBank(bankId) } },
    { label: '删除题库', danger: true, action: () => { closeModal(); confirmDeleteBank(bankId) } }
  ]
  modal.open = true
}

function renameBank(bankId) {
  const bank = Storage.getBank(bankId)
  if (!bank) return
  showPrompt('重命名题库', '输入新的题库名称', bank.name, (name) => {
    if (name && name.trim()) {
      Storage.renameBank(bankId, name.trim())
      toast('重命名成功')
      refreshHome()
      if (state.currentView === 'bank-detail' && currentBank.value) currentBank.value = Storage.getBank(bankId)
    }
  })
}

function editBankDesc(bankId) {
  const bank = Storage.getBank(bankId)
  if (!bank) return
  showPrompt('编辑描述', '输入题库描述', bank.description || '', (desc) => {
    Storage.updateBankDescription(bankId, desc.trim())
    toast('描述已更新')
    refreshHome()
  })
}

function confirmDeleteBank(bankId) {
  const bank = Storage.getBank(bankId)
  if (!bank) return
  showConfirm('删除题库', `确定要删除"${bank.name}"吗？此操作不可撤销，题库中的所有题目和相关错题记录都将被删除。`, () => {
    Storage.deleteBank(bankId)
    toast('题库已删除')
    refreshHome()
  })
}

function exportBank(bankId) {
  const pkg = Storage.exportBankPackage(bankId)
  if (!pkg) {
    toast('导出失败，题库不存在')
    return
  }
  const bank = Storage.getBank(bankId)
  saveTextFile(`${bank ? bank.name : '题库'}_题库互通包.qbank.json`, pkg)
}

function addQuestionsToBank(bankId) {
  state.currentBankId = bankId
  imp.existingBankId = bankId
  imp.previewQuestions = []
  showImport()
  const bank = Storage.getBank(bankId)
  imp.bankName = bank ? bank.name : ''
}

// ==================== 导入 ====================
function showImport() {
  state.currentView = 'import'
  imp.bankName = ''
  imp.bankDesc = ''
  imp.text = ''
  imp.fileBankName = ''
  imp.fileText = ''
  imp.fileTextShow = false
  imp.parseStatus = ''
  imp.previewShow = false
  imp.previewQuestions = []
  imp.pkgMode = false
  imp.existingBankId = ''
}

function switchImportTab(tab) {
  imp.tab = tab
}

async function previewImport() {
  const text = imp.text.trim()
  if (!text) {
    toast('请粘贴题目内容')
    return
  }
  const pkg = Storage.parseBankPackage(text)
  if (pkg) {
    imp.pkgMode = true
    imp.bankName = pkg.bank.name || imp.bankName
    imp.bankDesc = pkg.bank.description || ''
    imp.previewQuestions = pkg.bank.questions || []
    renderPreview(imp.previewQuestions, { countText: `互通包：${imp.previewQuestions.length} 题`, headerText: '题库互通包预览' })
    toast('已识别题库互通包，可直接确认导入')
    return
  }
  imp.pkgMode = false
  if (!imp.bankName.trim()) {
    toast('请输入题库名称')
    return
  }
  const questions = await resolveQuestionsWithFallback(text, {
    emptyMessage: '未识别到题目，请检查格式',
    failPrefix: 'AI 识别失败，已回退普通解析：'
  })
  if (!questions) return
  imp.previewQuestions = questions
  renderPreview(questions)
}

async function previewFileImport() {
  const text = imp.fileText.trim()
  if (!text) {
    toast('请先选择并解析文件')
    return
  }
  const pkg = Storage.parseBankPackage(text)
  if (pkg) {
    imp.pkgMode = true
    imp.bankName = pkg.bank.name || imp.fileBankName
    imp.bankDesc = pkg.bank.description || ''
    imp.previewQuestions = pkg.bank.questions || []
    renderPreview(imp.previewQuestions, { countText: `互通包：${imp.previewQuestions.length} 题`, headerText: '题库互通包预览' })
    toast('已识别题库互通包，可直接确认导入')
    return
  }
  imp.pkgMode = false
  if (!imp.fileBankName.trim()) {
    toast('请输入题库名称')
    return
  }
  const questions = await resolveQuestionsWithFallback(text, {
    emptyMessage: '已提取文本，但未识别到题目，请检查文档内容格式',
    failPrefix: 'AI 识别失败，已回退普通解析：'
  })
  if (!questions) return
  imp.previewQuestions = questions
  imp.bankName = imp.fileBankName
  renderPreview(questions)
}

function renderPreview(questions, options) {
  const previewOptions = options || {}
  imp.previewTitle = previewOptions.headerText || '解析结果'
  imp.previewCount = previewOptions.countText || `共 ${questions.length} 题`
  imp.previewQuestions = questions
  imp.previewShow = true
}

async function confirmImport() {
  const bankName = imp.bankName.trim()
  const bankDesc = imp.bankDesc.trim()
  const questions = imp.previewQuestions
  const pkgContent = imp.text

  if (!imp.pkgMode && questions.length === 0) {
    toast('没有可导入的题目')
    return
  }

  let bankId
  if (imp.pkgMode) {
    const res = Storage.importBankPackage(pkgContent)
    toast(res.message)
    if (!res.success) return
    bankId = res.bankId
  } else if (imp.existingBankId) {
    const count = Storage.addQuestions(imp.existingBankId, questions)
    bankId = imp.existingBankId
    toast(`成功追加 ${count} 道题目`)
  } else {
    const bank = Storage.createBank(bankName, bankDesc)
    const count = Storage.addQuestions(bank.id, questions)
    bankId = bank.id
    toast(`成功导入 ${count} 道题目`)
  }

  imp.previewQuestions = []
  imp.pkgMode = false
  openBank(bankId)

  const s = Storage.getSettings()
  if (s.aiEnabled && s.aiUseForExplanation && s.aiAutoExplainAfterImport) {
    setTimeout(async () => {
      await aiBatchGenerateExplanations(bankId, { onlyMissing: true, silentStart: false })
    }, 50)
  }
}

function cancelImport() {
  imp.previewShow = false
  imp.pkgMode = false
  imp.previewQuestions = []
}

async function handleFileUpload() {
  try {
    const file = await chooseDocument()
    imp.lastImportedFileType = 'document'
    imp.lastImportedImageName = ''
    if (!imp.fileBankName.trim()) {
      imp.fileBankName = FileParser.getDisplayName(file)
    }
    imp.fileText = ''
    imp.fileTextShow = true
    imp.parseStatus = `正在解析文件：${file.name}`
    try {
      if (typeof FileParser === 'undefined') throw new Error('文档解析模块未加载')
      if (!FileParser.isSupported(file)) throw new Error('不支持该文件格式，请上传 txt/docx/pdf/xlsx/csv 文件')
      const text = await FileParser.parseFile(file)
      imp.fileText = text
      const pkg = Storage.parseBankPackage(text)
      if (pkg) {
        imp.pkgMode = true
        imp.bankName = pkg.bank.name || imp.fileBankName.trim()
        imp.bankDesc = pkg.bank.description || ''
      } else {
        imp.pkgMode = false
      }
      const lineCount = text ? text.split(/\n/).filter(Boolean).length : 0
      imp.parseStatus = pkg
        ? `已识别题库互通包：${file.name}，包含 ${pkg.bank.questions.length} 道题目及学习统计`
        : `解析完成：${file.name}，提取到 ${text.length} 个字符 / ${lineCount} 行文本`
    } catch (error) {
      imp.fileText = ''
      imp.parseStatus = `解析失败：${error.message}`
      toast(error.message || '文件解析失败')
    }
  } catch (e) {
    // 用户取消选择
  }
}

async function handleImageUpload() {
  try {
    const res = await uni.chooseImage({ count: 1, sourceType: ['album', 'camera'] })
    let fileObj
    if (res.tempFiles && res.tempFiles[0]) fileObj = res.tempFiles[0]
    else fileObj = { path: res.tempFilePaths[0] }
    const settings = Storage.getSettings()
    imp.lastImportedFileType = 'image'
    imp.lastImportedImageName = fileObj.name || '图片'
    if (!settings.aiEnabled) {
      toast('请先在设置中开启 AI 功能后再使用 OCR 图片识题')
      return
    }
    if (!imp.fileBankName.trim()) {
      imp.fileBankName = imp.lastImportedImageName.replace(/\.[^.]+$/, '')
    }
    imp.parseStatus = `正在识别图片：${imp.lastImportedImageName}`
    imp.fileTextShow = true
    imp.fileText = ''
    try {
      toast('AI 正在识别图片中的题目...')
      const dataUrl = await readImageBase64(fileObj)
      const questions = await AiService.ocrQuestionsFromImage(dataUrl)
      if (!questions.length) throw new Error('图片中未识别到题目')
      const mergedText = questions.map(formatQuestionForText).join('\n\n')
      imp.text = mergedText
      imp.fileText = mergedText
      imp.bankName = imp.fileBankName.trim()
      imp.previewQuestions = questions
      renderPreview(questions)
      imp.parseStatus = `OCR 识别完成：${imp.lastImportedImageName}，识别到 ${questions.length} 道题目`
      toast(`OCR 识别完成，共 ${questions.length} 道题`)
    } catch (error) {
      imp.parseStatus = `OCR 识别失败：${error.message}`
      toast(error.message || '图片识别失败')
    }
  } catch (e) {
    // 取消
  }
}

// ==================== 背题模式 ====================
function startStudy(type) {
  const bank = Storage.getBank(state.currentBankId)
  if (!bank || bank.questions.length === 0) {
    toast('题库中没有题目')
    return
  }
  let questions = [...bank.questions]
  if (type) {
    questions = questions.filter((q) => q.type === type)
    if (questions.length === 0) {
      toast(`${Storage.getQuestionTypeName(type)}暂无题目`)
      return
    }
  }
  const settings = Storage.getSettings()
  if (settings.studyShuffle) shuffle(questions)
  state.currentStudyType = type || ''
  study.questions = questions
  study.index = 0
  navigate('study')
  renderStudyCard()
}

function startStudyByType(type) {
  startStudy(type)
}

function renderStudyCard() {
  const q = study.questions[study.index]
  if (!q) return
  study.q = q
  Storage.markStudied(state.currentBankId, q.id, true)
}

function nextStudyCard() {
  if (study.index < study.questions.length - 1) {
    study.index++
    renderStudyCard()
  } else {
    toast('已经是最后一题了')
  }
}

function prevStudyCard() {
  if (study.index > 0) {
    study.index--
    renderStudyCard()
  }
}

function toggleMastered() {
  const q = study.questions[study.index]
  if (!q) return
  const newMastered = !q.mastered
  Storage.markMastered(state.currentBankId, q.id, newMastered)
  q.mastered = newMastered
  if (newMastered) toast('已标记为掌握')
  else toast('已取消掌握')
}

function exitStudy() {
  navigate('home')
}

// ==================== 刷题模式 ====================
function startPractice(wrongOnly, type) {
  wrongOnly = wrongOnly || false
  const bank = Storage.getBank(state.currentBankId)
  if (!bank || bank.questions.length === 0) {
    toast('题库中没有题目')
    return
  }
  let questions
  if (wrongOnly) {
    const errors = Storage.getErrorsByBank(state.currentBankId)
    if (errors.length === 0) {
      toast('没有错题可练习')
      return
    }
    questions = errors.map((e) => e.question).filter((q) => q)
  } else {
    questions = [...bank.questions]
  }
  if (type) {
    questions = questions.filter((q) => q.type === type)
    if (questions.length === 0) {
      toast(`${Storage.getQuestionTypeName(type)}暂无可练习题目`)
      return
    }
  }
  state.practiceSessionKey = state.currentBankId || ''
  const session = Storage.getPracticeSession(state.currentBankId)
  const canResume = session && session.mode !== 'error-book' && session.wrongOnly === wrongOnly && (session.type || '') === (type || '') && Array.isArray(session.questions) && session.questions.length > 0
  if (canResume) {
    showConfirm('继续上次刷题', `检测到你上次练到了第 ${Math.min((session.index || 0) + 1, session.questions.length)} 题，是否继续？`, () => resumePracticeSession(session, bank))
    return
  }
  setupPracticeSession({ bank, questions, wrongOnly, type, mode: wrongOnly ? 'wrong-only' : 'normal' })
}

function startPracticeByType(type) {
  startPractice(false, type)
}

function setupPracticeSession(options) {
  const settings = Storage.getSettings()
  let questions = (options.questions || []).map((q) => q)
  if (settings.practiceShuffle) shuffle(questions)
  practice.questions = questions
  practice.index = 0
  practice.answers = {}
  practice.results = []
  practice.score = 0
  practice.wrongOnly = !!options.wrongOnly
  practice.bankMap = options.practiceBankMap || {}
  practice.errorPractice = options.mode === 'error-book'
  practice.favoriteMode = !!options.favoriteMode
  practice.sessionKey = options.sessionKey || state.currentBankId || ''
  practice.mode = options.mode || 'normal'
  practiceSaved.value = false
  navigate('practice')
  renderPracticeQuestion()
}

function resumePracticeSession(session, bank) {
  const questionIds = session.questions || []
  const practiceQuestions = questionIds.map((id) => bank.questions.find((q) => q.id === id)).filter(Boolean)
  if (!practiceQuestions.length) {
    Storage.clearPracticeSession(state.currentBankId)
    toast('上次保存的刷题进度已失效，已为你重新开始')
    startPractice(!!session.wrongOnly, session.type || '')
    return
  }
  practice.questions = practiceQuestions
  practice.index = Math.min(session.index || 0, practiceQuestions.length - 1)
  practice.answers = session.answers || {}
  practice.results = session.results || []
  practice.score = session.score || 0
  practice.wrongOnly = !!session.wrongOnly
  practice.bankMap = session.practiceBankMap || {}
  practice.errorPractice = false
  practice.favoriteMode = session.mode === 'favorites'
  practice.sessionKey = state.currentBankId || ''
  practice.mode = 'resume'
  practiceSaved.value = false
  navigate('practice')
  renderPracticeQuestion()
  toast('已恢复上次刷题进度')
}

function renderPracticeQuestion() {
  const q = practice.questions[practice.index]
  if (!q) {
    finishPractice()
    return
  }
  practice.q = q
  practice.submitted = false
  practice.feedback = { correct: false, userAnswer: '', aiReason: '', aiScore: '' }
  practice.selection = ''
  practice.multi = []
  practice.textAnswer = practice.answers[q.id] || ''
  const settings = Storage.getSettings()
  let options = q.options ? q.options.slice() : []
  let labels = 'ABCDEFGHIJ'.slice(0, options.length).split('')
  if ((q.type === 'single' || q.type === 'multiple') && settings.optionShuffle) {
    const arr = options.map((o, i) => ({ o, label: labels[i] }))
    shuffle(arr)
    options = arr.map((x) => x.o)
    labels = arr.map((x) => x.label)
  }
  practice.optionsView = options.map((o, i) => ({ label: labels[i], text: o }))
  practiceSaved.value = false
}

function optionSelected(label) {
  if (practice.q.type === 'multiple') return practice.multi.includes(label)
  return practice.selection === label
}

function optionClass(label) {
  const cls = []
  if (optionSelected(label)) cls.push('selected')
  if (practice.submitted) {
    const correctLabels = practice.q.answer.split('')
    if (correctLabels.includes(label)) cls.push('correct')
    if (optionSelected(label) && !correctLabels.includes(label)) cls.push('wrong')
  }
  return cls
}

function tfClass(value) {
  const cls = []
  if (practice.selection === value) cls.push('selected')
  if (practice.submitted) {
    if (practice.q.answer === value) cls.push('correct')
    if (practice.selection === value && practice.q.answer !== value) cls.push('wrong')
  }
  return cls
}

function inputClass() {
  if (!practice.submitted) return ''
  return practice.feedback.correct ? 'correct' : 'wrong'
}

function selectOption(label) {
  if (practice.submitted) return
  if (practice.q.type === 'multiple') {
    const idx = practice.multi.indexOf(label)
    if (idx >= 0) practice.multi.splice(idx, 1)
    else practice.multi.push(label)
  } else {
    practice.selection = label
  }
  persistCurrentPracticeAnswer()
}

function selectTrueFalse(value) {
  if (practice.submitted) return
  practice.selection = value
  persistCurrentPracticeAnswer()
}

function persistCurrentPracticeAnswer() {
  const q = practice.q
  if (!q) return
  const answer = collectPracticeAnswer()
  if (answer) practice.answers[q.id] = answer
}

function collectPracticeAnswer() {
  const q = practice.q
  if (!q) return ''
  if (q.type === 'single') return practice.selection
  if (q.type === 'multiple') return practice.multi.slice().sort().join('')
  if (q.type === 'truefalse') return practice.selection
  return practice.textAnswer.trim()
}

function checkAnswer(q, userAnswer) {
  if (q.type === 'single' || q.type === 'multiple') return userAnswer.toUpperCase() === q.answer.toUpperCase()
  if (q.type === 'truefalse') return userAnswer === q.answer
  const normalize = (s) => s.trim().toLowerCase().replace(/\s+/g, '')
  return normalize(userAnswer) === normalize(q.answer)
}

async function practiceSubmit() {
  const q = practice.q
  if (!q || practice.submitting) return
  if (practice.submitted) {
    toast('这道题已经作答，可直接切换上下题')
    return
  }
  const userAnswer = collectPracticeAnswer()
  if (!userAnswer) {
    toast(q.type === 'single' || q.type === 'multiple' || q.type === 'truefalse' ? '请选择答案' : '请输入答案')
    return
  }
  practice.answers[q.id] = userAnswer
  practice.submitting = true
  let correct = checkAnswer(q, userAnswer)
  let aiReason = ''
  let aiScore = correct ? 1 : 0
  const settings = Storage.getSettings()
  if (!correct && (q.type === 'fillblank' || q.type === 'shortanswer') && settings.aiEnabled && settings.aiUseForSubjectiveGrading) {
    try {
      toast('AI 正在进行语义判分...')
      const res = await AiService.gradeSubjectiveAnswer(q, userAnswer)
      correct = !!res.correct
      aiReason = res.reason || ''
      aiScore = typeof res.score === 'number' ? res.score : correct ? 1 : 0
    } catch (error) {
      if (settings.aiAutoFallback) {
        aiReason = 'AI 判分失败，已回退为普通字符串判分'
        toast('AI 判分失败，已自动回退普通判分')
      } else {
        practice.submitting = false
        toast(error.message || 'AI 判分失败')
        return
      }
    }
  }
  practice.results.push({ questionId: q.id, correct, userAnswer, skipped: false, aiReason, aiScore })
  practice.submitted = true
  practice.feedback = { correct, userAnswer, aiReason, aiScore }
  if (correct) {
    practice.score += Math.round(100 / practice.questions.length)
    if (practice.wrongOnly) {
      const bankId = practice.bankMap[q.id] || state.currentBankId
      Storage.removeErrorByQuestion(bankId, q.id)
    }
  } else if (settings.autoError) {
    const bankId = practice.bankMap[q.id] || state.currentBankId
    Storage.addError(bankId, q.id, userAnswer)
  }
  practice.submitting = false
  savePracticeProgress(false, true)
}

function practiceSkip() {
  const q = practice.questions[practice.index]
  if (!q) return
  if (!practice.submitted) {
    practice.results.push({ questionId: q.id, correct: false, userAnswer: '', skipped: true })
  }
  practiceNext()
}

function practicePrev() {
  persistCurrentPracticeAnswer()
  if (practice.index > 0) {
    practice.index--
    renderPracticeQuestion()
  }
}

function practiceNextDirect() {
  persistCurrentPracticeAnswer()
  if (practice.index >= practice.questions.length - 1) {
    toast('已经是最后一题了')
    return
  }
  practice.index++
  renderPracticeQuestion()
}

function practiceNext() {
  persistCurrentPracticeAnswer()
  practice.index++
  if (practice.index >= practice.questions.length) finishPractice()
  else renderPracticeQuestion()
}

function togglePracticeFavorite() {
  const q = practice.q
  if (!q) return
  const bankId = practice.bankMap[q.id] || state.currentBankId
  const favorite = Storage.toggleFavorite(bankId, q.id)
  q.favorite = favorite
  if (practice.favoriteMode && !favorite) {
    toast('已取消收藏，当前题仍可继续完成本次练习')
    return
  }
  toast(favorite ? '已加入收藏' : '已取消收藏')
}

function addCurrentToErrorBook() {
  const q = practice.q
  if (!q) return
  const bankId = practice.bankMap[q.id] || state.currentBankId
  const answer = collectPracticeAnswer()
  Storage.addError(bankId, q.id, answer)
  toast('已加入错题本')
}

function savePracticeProgress(exitAfterSave, silent) {
  persistCurrentPracticeAnswer()
  const bankId = state.currentBankId
  if (!bankId || !practice.questions.length) {
    if (!silent) toast('当前没有可保存的刷题进度')
    return false
  }
  const sessionPayload = {
    mode: practice.errorPractice ? 'error-book' : practice.mode,
    wrongOnly: practice.wrongOnly,
    type: state.currentPracticeType || '',
    questions: practice.questions.map((q) => q.id),
    index: practice.index,
    answers: practice.answers,
    results: practice.results,
    score: practice.score,
    practiceBankMap: practice.bankMap
  }
  if (practice.favoriteMode) Storage.saveGenericPracticeSession(practice.sessionKey || 'favorites-session', sessionPayload)
  else Storage.savePracticeSession(bankId, sessionPayload)
  practiceSaved.value = true
  if (!silent) toast(exitAfterSave ? '进度已保存，稍后可继续刷题' : '刷题进度已保存')
  if (exitAfterSave) navigate('home')
  return true
}

function finishPractice() {
  const total = practice.questions.length
  const correct = practice.results.filter((r) => r.correct).length
  const wrong = practice.results.filter((r) => !r.correct && !r.skipped).length
  const skip = practice.results.filter((r) => r.skipped).length
  const bankBreakdown = {}
  practice.questions.forEach((question) => {
    const bankId = practice.bankMap[question.id] || state.currentBankId
    if (!bankId) return
    if (!bankBreakdown[bankId]) bankBreakdown[bankId] = { practiced: 0, correct: 0 }
    bankBreakdown[bankId].practiced += 1
    const r = practice.results.find((item) => item.questionId === question.id)
    if (r && r.correct) bankBreakdown[bankId].correct += 1
  })
  Storage.recordPractice(total, correct, { bankId: state.currentBankId, bankBreakdown })
  if (practice.favoriteMode) Storage.clearGenericPracticeSession(practice.sessionKey || 'favorites-session')
  else Storage.clearPracticeSession(state.currentBankId)

  result.total = total
  result.correct = correct
  result.wrong = wrong
  result.skip = skip
  result.score = practice.score
  result.offset = 440 * (1 - practice.score / 100)
  state.currentPracticeType = state.currentPracticeType
  navigate('practice-result')
}

function practiceWrongOnly() {
  startPractice(true, state.currentPracticeType || '')
}

function exitPractice() {
  if (practice.questions.length) {
    showConfirm('退出刷题', '是否先保存当前刷题进度？', () => savePracticeProgress(true))
    return
  }
  navigate('home')
}

// ==================== 错题 / 收藏 ====================
function startErrorPractice() {
  const errors = Storage.getErrorBook()
  if (errors.length === 0) {
    toast('错题本为空')
    return
  }
  const practiceBankMap = {}
  errors.forEach((e) => {
    if (e.question) practiceBankMap[e.question.id] = e.bankId
  })
  const questions = errors.map((e) => e.question).filter((q) => q)
  setupPracticeSession({ bank: null, questions, wrongOnly: true, type: '', mode: 'error-book', practiceBankMap })
}

function startFavoritePractice() {
  const favorites = Storage.getAllFavorites()
  if (favorites.length === 0) {
    toast('收藏夹为空')
    return
  }
  const practiceBankMap = {}
  const questions = favorites.map((item) => {
    practiceBankMap[item.question.id] = item.bankId
    return item.question
  })
  practice.sessionKey = 'favorites-session'
  const session = Storage.getGenericPracticeSession(practice.sessionKey)
  const canResume = session && session.mode === 'favorites' && Array.isArray(session.questions) && session.questions.length > 0
  if (canResume) {
    showConfirm('继续收藏练习', `检测到你上次练到了第 ${Math.min((session.index || 0) + 1, session.questions.length)} 题，是否继续？`, () => resumeFavoritePracticeSession(session))
    return
  }
  setupPracticeSession({ bank: null, questions, wrongOnly: false, type: '', mode: 'favorites', practiceBankMap, favoriteMode: true, sessionKey: practice.sessionKey })
}

function resumeFavoritePracticeSession(session) {
  const favorites = Storage.getAllFavorites()
  const favoriteQuestionMap = new Map()
  favorites.forEach((item) => favoriteQuestionMap.set(item.question.id, item.question))
  const questionIds = session.questions || []
  const practiceQuestions = questionIds.map((id) => favoriteQuestionMap.get(id)).filter(Boolean)
  if (!practiceQuestions.length) {
    Storage.clearGenericPracticeSession(practice.sessionKey)
    toast('上次保存的收藏练习进度已失效，已为你重新开始')
    startFavoritePractice()
    return
  }
  practice.questions = practiceQuestions
  practice.index = Math.min(session.index || 0, practiceQuestions.length - 1)
  practice.answers = session.answers || {}
  practice.results = session.results || []
  practice.score = session.score || 0
  practice.wrongOnly = !!session.wrongOnly
  practice.bankMap = session.practiceBankMap || {}
  practice.favoriteMode = true
  practice.sessionKey = practice.sessionKey
  practice.mode = 'resume'
  practiceSaved.value = false
  navigate('practice')
  renderPracticeQuestion()
  toast('已恢复上次收藏练习进度')
}

function refreshFavorites() {
  favoriteList.value = Storage.getAllFavorites()
}

function removeFavorite(bankId, questionId) {
  Storage.setFavorite(bankId, questionId, false)
  toast('已取消收藏')
  refreshFavorites()
}

function refreshErrorBook() {
  const errors = Storage.getErrorBook()
  errorList.value = errorFilterBank.value ? errors.filter((e) => e.bankId === errorFilterBank.value) : errors
}

function filterErrors() {
  refreshErrorBook()
}

function onErrorFilterChange(e) {
  const item = errorFilterRange.value[e.detail.value]
  errorFilterBank.value = item ? item.id : ''
  filterErrors()
}

function removeError(errorId) {
  Storage.removeError(errorId)
  toast('已从错题本移除')
  refreshErrorBook()
}

function clearAllErrors() {
  const errors = Storage.getErrorBook()
  if (errors.length === 0) {
    toast('错题本已经是空的')
    return
  }
  showConfirm('清空错题本', '确定要清空所有错题记录吗？此操作不可撤销。', () => {
    Storage.clearAllErrors()
    toast('错题本已清空')
    refreshErrorBook()
  })
}

// ==================== 统计 ====================
function refreshStats() {
  const s = Storage.getStats()
  stats.totalQuestions = s.totalQuestions
  stats.totalMastered = s.totalMastered
  stats.totalPracticed = s.totalPracticed
  stats.errorCount = s.errorCount
  stats.overallRate = s.overallRate
  stats.bankList = Storage.getAllBanks().map((b) => {
    const bs = Storage.getBankStudyStats(b.id)
    const rate = b.questionCount > 0 ? Math.round((b.masteredCount / b.questionCount) * 100) : 0
    return {
      id: b.id,
      name: b.name,
      questionCount: b.questionCount,
      masteredCount: b.masteredCount,
      rate,
      practiced: bs ? bs.totalPracticed : 0,
      accuracy: bs ? bs.accuracy : 0
    }
  })
  const history = Storage.getRecentHistory(7)
  const hasData = history.some((h) => h.practiced > 0)
  stats.chartHasData = hasData
  stats.chartMax = Math.max(...history.map((h) => h.practiced), 1)
  stats.chart = history.map((h) => {
    const d = new Date(h.date)
    return { practiced: h.practiced, rate: h.rate, label: d.getMonth() + 1 + '/' + d.getDate() }
  })
}

// ==================== 设置 ====================
function refreshSettings() {
  Object.assign(settings, Storage.getSettings())
}

function saveSettings() {
  Storage.updateSettings({
    studyShuffle: settings.studyShuffle,
    practiceShuffle: settings.practiceShuffle,
    optionShuffle: settings.optionShuffle,
    autoError: settings.autoError,
    showExplanation: settings.showExplanation,
    aiEnabled: settings.aiEnabled,
    aiBaseUrl: settings.aiBaseUrl.trim(),
    aiApiKey: settings.aiApiKey.trim(),
    aiModel: settings.aiModel.trim(),
    aiUseForImport: settings.aiUseForImport,
    aiUseForExplanation: settings.aiUseForExplanation,
    aiAutoExplainAfterImport: settings.aiAutoExplainAfterImport,
    aiUseForSubjectiveGrading: settings.aiUseForSubjectiveGrading,
    aiAutoFallback: settings.aiAutoFallback
  })
}

async function testAiConnection() {
  aiTestResult.value = '正在测试 AI 接口...'
  try {
    const res = await AiService.testConnection()
    aiTestResult.value = res.message || 'AI 接口可用'
    toast('AI 接口测试成功')
  } catch (error) {
    aiTestResult.value = error.message || 'AI 接口测试失败'
    toast(error.message || 'AI 接口测试失败')
  }
}

function exportData() {
  const data = Storage.exportData()
  const date = new Date().toISOString().split('T')[0]
  saveTextFile(`题库大师_备份_${date}.json`, data)
}

async function importData() {
  try {
    const file = await chooseDocument()
    const text = await readTextContent(file)
    const pkg = Storage.parseBankPackage(text)
    if (pkg) {
      showConfirm('导入题库互通包', '将新增一个题库，并同步其学习统计、错题记录与续答进度，确定继续吗？', () => {
        const res = Storage.importBankPackage(text)
        toast(res.message)
        if (res.success) {
          refreshSettings()
          refreshHome()
          refreshStats()
        }
      })
      return
    }
    showConfirm('导入数据', '导入将覆盖当前所有数据，确定继续吗？', () => {
      const res = Storage.importData(text)
      toast(res.message)
      if (res.success) {
        refreshSettings()
        refreshHome()
        refreshStats()
      }
    })
  } catch (e) {
    // 取消
  }
}

function clearAllData() {
  showConfirm('清空所有数据', '⚠️ 此操作将删除所有题库、题目、错题记录和统计数据，且不可恢复！确定要继续吗？', () => {
    Storage.clearAllData()
    toast('所有数据已清空')
    navigate('home')
  })
}

// ==================== 编辑题目 ====================
function showAddQuestion() {
  edit.id = null
  edit.type = 'single'
  edit.content = ''
  edit.answer = ''
  edit.explanation = ''
  edit.options = ['', '', '', '']
  edit.title = '添加题目'
  onQuestionTypeChange()
  navigate('edit-question')
}

function showEditQuestion(bankId, questionId) {
  const q = Storage.getQuestion(bankId, questionId)
  if (!q) return
  state.currentBankId = bankId
  edit.id = questionId
  edit.type = q.type
  edit.content = q.content
  edit.answer = q.answer
  edit.explanation = q.explanation || ''
  edit.options = [...(q.options || [])]
  edit.title = '编辑题目'
  onQuestionTypeChange()
  navigate('edit-question')
}

async function aiFormatImportText() {
  const rawText = imp.text.trim()
  if (!rawText) {
    toast('请先输入原始题目文本')
    return
  }
  try {
    toast('AI 正在识别并排版题目...')
    const questions = await AiService.parseQuestionsFromText(rawText)
    if (!questions.length) {
      toast('AI 未识别到题目')
      return
    }
    imp.previewQuestions = questions
    imp.text = questions.map(formatQuestionForText).join('\n\n')
    renderPreview(questions)
  } catch (error) {
    toast(error.message || 'AI 识别失败')
  }
}

async function aiFormatFileText() {
  const rawText = imp.fileText.trim()
  if (!rawText) {
    toast('请先上传并提取文档文本')
    return
  }
  try {
    toast('AI 正在识别文档中的题目...')
    const questions = await AiService.parseQuestionsFromText(rawText)
    if (!questions.length) {
      toast('AI 未识别到题目')
      return
    }
    imp.previewQuestions = questions
    const mergedText = questions.map(formatQuestionForText).join('\n\n')
    imp.fileText = mergedText
    imp.text = mergedText
    imp.bankName = imp.fileBankName.trim()
    renderPreview(questions)
  } catch (error) {
    toast(error.message || 'AI 识别失败')
  }
}

async function aiGenerateExplanation() {
  const s = Storage.getSettings()
  if (!s.aiEnabled || !s.aiUseForExplanation) {
    toast('请先在设置中开启 AI 解析功能')
    return
  }
  const type = edit.type
  const content = edit.content.trim()
  const answer = edit.answer.trim()
  const options = type === 'single' || type === 'multiple' ? edit.options.filter((o) => o.trim()) : []
  if (!content || !answer) {
    toast('请先填写题目和答案')
    return
  }
  try {
    toast('AI 正在生成解析...')
    const explanation = await AiService.generateExplanation({ type, content, answer, options })
    edit.explanation = explanation
    toast('AI 解析已生成')
  } catch (error) {
    toast(error.message || 'AI 生成解析失败')
  }
}

async function aiGenerateQuestionExplanation(bankId, questionId) {
  const s = Storage.getSettings()
  if (!s.aiEnabled || !s.aiUseForExplanation) {
    toast('请先在设置中开启 AI 解析功能')
    return
  }
  const q = Storage.getQuestion(bankId, questionId)
  if (!q) {
    toast('题目不存在')
    return
  }
  try {
    toast('AI 正在补全本题解析...')
    const explanation = await AiService.generateExplanation(q)
    Storage.updateQuestion(bankId, questionId, { explanation })
    if (state.currentView === 'bank-detail') currentBank.value = Storage.getBank(bankId)
    toast('本题解析已补全')
  } catch (error) {
    toast(error.message || 'AI 补全解析失败')
  }
}

async function aiBatchGenerateExplanations(targetBankId, options) {
  const bankId = targetBankId || state.currentBankId
  const s = Storage.getSettings()
  if (!s.aiEnabled || !s.aiUseForExplanation) {
    toast('请先在设置中开启 AI 解析功能')
    return
  }
  const bank = Storage.getBank(bankId)
  if (!bank) {
    toast('题库不存在')
    return
  }
  const onlyMissing = !options || options.onlyMissing !== false
  const queue = bank.questions.map((q, index) => ({ q, index })).filter((item) => (onlyMissing ? !item.q.explanation : true))
  if (!queue.length) {
    toast(onlyMissing ? '当前题库所有题目都已有解析' : '没有可处理的题目')
    return
  }
  if (!options || !options.silentStart) toast(`开始批量补全解析，共 ${queue.length} 题`)
  let successCount = 0
  let failCount = 0
  for (let i = 0; i < queue.length; i++) {
    try {
      const explanation = await AiService.generateExplanation(queue[i].q)
      Storage.updateQuestion(bankId, queue[i].q.id, { explanation })
      successCount++
    } catch (error) {
      failCount++
      if (!s.aiAutoFallback) throw error
    }
  }
  if (state.currentView === 'bank-detail') currentBank.value = Storage.getBank(bankId)
  toast(`批量补全完成：成功 ${successCount} 题，失败 ${failCount} 题`)
}

async function aiFormatCurrentQuestion() {
  const rawText = edit.content.trim()
  if (!rawText) {
    toast('请先粘贴原始题目内容')
    return
  }
  try {
    toast('AI 正在识别题目结构...')
    const questions = await AiService.parseQuestionsFromText(rawText)
    const q = questions[0]
    if (!q) {
      toast('AI 未识别到题目')
      return
    }
    edit.type = q.type
    edit.content = q.content
    edit.answer = q.answer
    edit.explanation = q.explanation || ''
    edit.options = q.options || []
    onQuestionTypeChange()
    toast('AI 已完成题目识别')
  } catch (error) {
    toast(error.message || 'AI 识别失败')
  }
}

function onEditTypePickerChange(e) {
  const item = editTypeRange[e.detail.value]
  if (item) edit.type = item.value
  onQuestionTypeChange()
}

function onQuestionTypeChange() {
  if (edit.type === 'single' || edit.type === 'multiple') {
    if (edit.options.length === 0) edit.options = ['', '', '', '']
  }
  const hints = {
    single: '输入正确选项的字母，如：A',
    multiple: '输入所有正确选项的字母，如：ABC',
    truefalse: '输入"正确"或"错误"',
    fillblank: '输入填空答案',
    shortanswer: '输入参考答案'
  }
  edit.answerHint = hints[edit.type] || ''
}

function addOption() {
  if (edit.options.length >= 10) {
    toast('最多10个选项')
    return
  }
  edit.options.push('')
}

function removeEditOption(index) {
  edit.options.splice(index, 1)
}

function saveQuestion() {
  const type = edit.type
  const content = edit.content.trim()
  const answer = edit.answer.trim()
  const explanation = edit.explanation.trim()
  if (!content) {
    toast('请输入题目内容')
    return
  }
  if (!answer) {
    toast('请输入正确答案')
    return
  }
  const questionData = { type, content, answer, explanation }
  if (type === 'single' || type === 'multiple') {
    questionData.options = edit.options.filter((o) => o.trim())
    if (questionData.options.length < 2) {
      toast('至少需要2个选项')
      return
    }
  }
  if (edit.id) {
    Storage.updateQuestion(state.currentBankId, edit.id, questionData)
    toast('题目已更新')
  } else {
    Storage.addQuestion(state.currentBankId, questionData)
    toast('题目已添加')
  }
  openBank(state.currentBankId)
}

function cancelEditQuestion() {
  openBank(state.currentBankId)
}

function deleteQuestion(bankId, questionId) {
  showConfirm('删除题目', '确定要删除这道题目吗？', () => {
    Storage.deleteQuestion(bankId, questionId)
    toast('题目已删除')
    if (state.currentView === 'bank-detail') currentBank.value = Storage.getBank(bankId)
  })
}

// ==================== 模态框 ====================
function showConfirm(title, message, onOk) {
  modal.type = 'confirm'
  modal.title = title
  modal.message = message
  modal.onConfirm = onOk
  modal.open = true
}

function showPrompt(title, message, defaultValue, onOk) {
  modal.type = 'prompt'
  modal.title = title
  modal.message = message
  modal.promptValue = defaultValue || ''
  modal.onConfirm = onOk
  modal.open = true
}

function confirmModal() {
  const fn = modal.onConfirm
  closeModal()
  if (fn) fn(modal.promptValue)
}

function closeModal() {
  modal.open = false
  modal.type = ''
  modal.items = []
  modal.onConfirm = null
}

// ==================== 工具 ====================
async function resolveQuestionsWithFallback(text, options) {
  const settings = Storage.getSettings()
  const parsed = Parser.parse(text)
  if (parsed.length > 0 && !settings.aiUseForImport) return parsed
  if (settings.aiEnabled && settings.aiUseForImport) {
    try {
      toast('正在使用 AI 识别题目...')
      const aiQuestions = await AiService.parseQuestionsFromText(text)
      if (aiQuestions.length > 0) return aiQuestions
    } catch (error) {
      if (settings.aiAutoFallback) {
        const failMessage = (options && options.failPrefix ? options.failPrefix : 'AI 识别失败，已回退普通解析：') + (error.message || '未知错误')
        if (parsed.length > 0) {
          toast(failMessage)
          return parsed
        }
        toast(failMessage)
        return null
      }
      toast(error.message || 'AI 识别失败')
      return null
    }
  }
  if (parsed.length > 0) return parsed
  toast(options && options.emptyMessage ? options.emptyMessage : '未识别到题目')
  return null
}

function formatQuestionForText(q, index) {
  const labels = 'ABCDEFGHIJ'
  const lines = []
  lines.push(`${typeof index === 'number' ? index + 1 : ''}${typeof index === 'number' ? '. ' : ''}${q.content}`.trim())
  if (q.options && q.options.length) {
    q.options.forEach((opt, idx) => {
      lines.push(`${labels[idx]}. ${opt}`)
    })
  }
  if (q.answer) lines.push(`答案：${q.answer}`)
  if (q.explanation) lines.push(`解析：${q.explanation}`)
  return lines.join('\n')
}

function loadDemoData() {
  const demoText = Parser.getExampleText()
  const questions = Parser.parse(demoText)
  const bank = Storage.createBank('编程基础题库（示例）', '包含单选、多选、判断、填空、简答五种题型的示例题目')
  Storage.addQuestions(bank.id, questions)
}

function init() {
  const banks = Storage.getAllBanks()
  if (banks.length === 0) loadDemoData()
  refreshHome()
  // 默认进入首页
  state.currentView = 'home'
}

onMounted(() => {
  init()
  initAuth()
})

// 暴露给模板
defineExpose({})
</script>
