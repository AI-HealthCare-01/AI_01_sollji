import React, { useState, useEffect } from 'react';  // ← React 명시적 import (UMD 경고 해결)
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AppLayout from '../components/layout/AppLayout';
import {
  getMyInfo,
  updateMyName,
  changePassword,
  deleteAccount,
} from '../api/client';

// ─── axios 에러 헬퍼 ─────────────────────────────────────────
interface AxiosLikeError {
  response?: { data?: { detail?: string } };
}
const getErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as AxiosLikeError;
  return e?.response?.data?.detail ?? fallback;
};

// ─── 공통 스타일 ─────────────────────────────────────────────
const inputCls = `w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-300`;

// ─── 섹션 카드 ───────────────────────────────────────────────
function SectionCard({ title, children }: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
      <h2 className="text-base font-bold text-gray-700">{title}</h2>
      {children}
    </div>
  );
}

// ─── 피드백 메시지 ────────────────────────────────────────────
function Feedback({ msg }: { msg: string | null }) {
  if (!msg) return null;
  const isSuccess = msg.startsWith('✅');
  return (
    <p className={`text-xs ${isSuccess ? 'text-blue-500' : 'text-red-400'}`}>
      {msg}
    </p>
  );
}

// ─── 메인 ────────────────────────────────────────────────────
export default function MyPage() {
  const navigate = useNavigate();
  const { logout, updateUser } = useAuthStore();

  // 계정 정보
  const [email,       setEmail]       = useState('');
  const [createdAt,   setCreatedAt]   = useState('');
  const [infoLoading, setInfoLoading] = useState(true);

  // 이름 수정
  const [name,       setName]       = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg,    setNameMsg]    = useState<string | null>(null);

  // 비밀번호 변경
  const [pwForm,   setPwForm]   = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg,    setPwMsg]    = useState<string | null>(null);

  // 회원탈퇴
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError,   setDeleteError]   = useState<string | null>(null);

  // ── 내 정보 로드 ────────────────────────────────────────
  useEffect(() => {
    void (async () => {
      try {
        const data = await getMyInfo();
        setEmail(data.email ?? '');
        setName(data.name ?? '');
        setCreatedAt(
          data.created_at
            ? new Date(data.created_at).toLocaleDateString('ko-KR')
            : ''
        );
      } catch {
        // 조회 실패 시 빈 값 유지
      } finally {
        setInfoLoading(false);
      }
    })();
  }, []);

  // ── 이름 저장 ────────────────────────────────────────────
  const handleSaveName = async () => {
    if (!name.trim()) return;
    setNameSaving(true);
    setNameMsg(null);
    try {
      await updateMyName(name.trim());
      updateUser({ name: name.trim() });
      setNameMsg('✅ 이름이 변경됐어요.');
    } catch (err: unknown) {
      setNameMsg(getErrorMessage(err, '이름 변경에 실패했어요.'));
    } finally {
      setNameSaving(false);
    }
  };

  // ── 비밀번호 변경 ─────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.next) return;
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg('새 비밀번호가 일치하지 않아요.');
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      await changePassword({
        current_password: pwForm.current,
        new_password: pwForm.next,
      });
      setPwMsg('✅ 비밀번호가 변경됐어요.');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err: unknown) {
      setPwMsg(getErrorMessage(err, '비밀번호 변경에 실패했어요.'));
    } finally {
      setPwSaving(false);
    }
  };

  // ── 회원탈퇴 ─────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      logout();
      navigate('/');
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err, '회원탈퇴에 실패했어요.'));
      setDeleteLoading(false);
    }
  };

  // ── 로그아웃 ─────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-10 px-6 space-y-5">

        {/* 헤더 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">마이페이지</h1>
          <p className="text-gray-400 text-sm mt-1">계정 정보를 관리해요</p>
        </div>

        {infoLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
            불러오는 중...
          </div>
        ) : (
          <>
            {/* ── 계정 정보 ── */}
            <SectionCard title="👤 계정 정보">
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                {[
                  ['이메일', email     || '-'],
                  ['가입일', createdAt || '-'],
                ].map(([label, value]) => (
                  <div key={label}
                    className="flex items-center justify-between py-1.5 border-b border-gray-50">
                    <span className="text-sm text-gray-400">{label}</span>
                    <span className="text-sm font-medium text-gray-700">{value}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* ── 이름 수정 ── */}
            <SectionCard title="✏️ 이름 수정">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                className={inputCls}
              />
              <Feedback msg={nameMsg} />
              <button
                onClick={handleSaveName}
                disabled={nameSaving}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm
                           font-semibold hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {nameSaving ? '저장 중...' : '저장'}
              </button>
            </SectionCard>

            {/* ── 비밀번호 변경 ── */}
            <SectionCard title="🔒 비밀번호 변경">
              {(['current', 'next', 'confirm'] as const).map((key) => (
                <input
                  key={key}
                  type="password"
                  value={pwForm[key]}
                  onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={
                    key === 'current' ? '현재 비밀번호' :
                    key === 'next'    ? '새 비밀번호'   :
                                        '새 비밀번호 확인'
                  }
                  className={inputCls}
                />
              ))}
              <Feedback msg={pwMsg} />
              <button
                onClick={handleChangePassword}
                disabled={pwSaving}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm
                           font-semibold hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {pwSaving ? '변경 중...' : '비밀번호 변경'}
              </button>
            </SectionCard>

            {/* ── 로그아웃 ── */}
            <SectionCard title="🚪 로그아웃">
              <p className="text-sm text-gray-400">현재 기기에서 로그아웃해요.</p>
              <button
                onClick={handleLogout}
                className="w-full border border-gray-200 text-gray-600 py-2.5 rounded-xl
                           text-sm font-semibold hover:bg-gray-50 transition-all"
              >
                로그아웃
              </button>
            </SectionCard>

            {/* ── 회원탈퇴 ── */}
            <SectionCard title="⚠️ 회원탈퇴">
              <p className="text-sm text-gray-400">
                탈퇴 시 모든 데이터가 삭제되며 복구할 수 없어요.
              </p>

              {!showConfirm ? (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="w-full border border-red-200 text-red-400 py-2.5 rounded-xl
                             text-sm font-semibold hover:bg-red-50 transition-all"
                >
                  회원탈퇴
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-500 text-center">
                    정말 탈퇴하시겠어요? 이 작업은 되돌릴 수 없어요.
                  </p>
                  <Feedback msg={deleteError} />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="flex-1 border border-gray-200 text-gray-500 py-2.5
                                 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm
                                 font-semibold hover:bg-red-600 transition-all disabled:opacity-50"
                    >
                      {deleteLoading ? '처리 중...' : '탈퇴 확인'}
                    </button>
                  </div>
                </div>
              )}
            </SectionCard>
          </>
        )}

      </div>
    </AppLayout>
  );
}
