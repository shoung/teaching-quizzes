# 教學測驗集 Implementation Plan

**Goal:** 建立公開 GitHub 儲存庫及可於 GitHub Pages 使用的教學測驗前端。

**Architecture:** 型別化題庫、共用答題狀態、Hash 路由及共用結果頁。所有計分在瀏覽器執行。

**Tech Stack:** React、TypeScript、Vite、Vitest、Testing Library。

**Spec:** `docs/design.md`、`AGENTS.md` 與使用者提供的四步驟流程。

## Global Constraints
- 繁體中文、純靜態、一頁一題、前端結果、支援 GitHub Pages 專案子路徑。

## Review Focus
- 未選題不能前進；上一頁答案保留。
- 直接開啟後續題或結果，不能跳過未答題。
- 舊版本或損壞的儲存資料不影響進入測驗。
- 重新測驗不殘留前次答案。
- 手機排版、鍵盤焦點與深層連結重新整理。

## Tasks
- [ ] 1. 建立專案規則、工具設定與題庫型別；安裝依賴。
- [ ] 2. 先寫計分、儲存驗證與真實元件流程測試並確認失敗。
- [ ] 3. 實作題庫、進度驗證、目錄、答題、結果、樣式；確認測試及建置成功。
- [ ] 4. 瀏覽器檢查桌面、手機及完整答題流程。
- [ ] 5. git init、提交、建立公開儲存庫、啟用 Pages、推送並驗證線上部署。
