package dsa;

import java.util.Arrays;

/**
 * Quy hoạch động nhập môn. Mỗi bài đều theo 4 bước:
 *   1. dp[i] nghĩa là gì   2. công thức chuyển   3. giá trị đầu   4. đáp án ở đâu
 */
public class DynamicProgrammingDemo {

    public static void main(String[] args) {
        System.out.println("Số cách leo 10 bậc (1 hoặc 2 bậc/lần) = " + climbStairs(10));
        System.out.println("Nhà cướp [2,7,9,3,1] lấy được nhiều nhất = " + rob(new int[]{2, 7, 9, 3, 1}));

        int[] coins = {1, 3, 4};
        int amount = 6;
        System.out.println("\nĐổi " + amount + " với mệnh giá " + Arrays.toString(coins) + ":");
        System.out.println("  Tham lam (lấy tờ to nhất trước) = " + greedyCoins(coins, amount) + " tờ  <- SAI");
        System.out.println("  Quy hoạch động                  = " + coinChange(coins, amount) + " tờ  <- đúng (3+3)");
        System.out.println("Số cách đổi 5 bằng [1,2,5] = " + coinWays(new int[]{1, 2, 5}, 5));

        int[] prices = {10, 9, 2, 5, 3, 7, 101, 18};
        System.out.println("\nDãy con tăng dài nhất của " + Arrays.toString(prices) + " = "
                + longestIncreasingSubsequence(prices));
        System.out.println("Dãy con chung dài nhất của 'abcde' và 'ace' = "
                + longestCommonSubsequence("abcde", "ace"));
        System.out.println("Khoảng cách sửa 'kitten' -> 'sitting' = " + editDistance("kitten", "sitting")
                + "  (dùng để gợi ý 'Có phải bạn muốn tìm...')");
    }

    /** dp[i] = số cách lên bậc i = dp[i-1] + dp[i-2]. Chỉ cần nhớ 2 giá trị trước -> O(1) bộ nhớ. */
    static long climbStairs(int n) {
        long prev2 = 1, prev1 = 1;                   // dp[0], dp[1]
        for (int i = 2; i <= n; i++) {
            long cur = prev1 + prev2;
            prev2 = prev1;
            prev1 = cur;
        }
        return prev1;
    }

    /**
     * Không được cướp 2 nhà liền kề. dp[i] = số tiền lớn nhất khi xét tới nhà i.
     * Hoặc bỏ nhà i (dp[i-1]), hoặc cướp nhà i (dp[i-2] + a[i]).
     */
    static int rob(int[] a) {
        int prev2 = 0, prev1 = 0;
        for (int x : a) {
            int cur = Math.max(prev1, prev2 + x);
            prev2 = prev1;
            prev1 = cur;
        }
        return prev1;
    }

    static int greedyCoins(int[] coins, int amount) {
        int[] sorted = coins.clone();
        Arrays.sort(sorted);
        int count = 0;
        for (int i = sorted.length - 1; i >= 0; i--) {
            count += amount / sorted[i];
            amount %= sorted[i];
        }
        return amount == 0 ? count : -1;
    }

    /** dp[x] = số tờ ít nhất để đổi x. dp[x] = min(dp[x - coin] + 1). */
    static int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, Integer.MAX_VALUE);
        dp[0] = 0;
        for (int x = 1; x <= amount; x++) {
            for (int coin : coins) {
                if (coin <= x && dp[x - coin] != Integer.MAX_VALUE) {
                    dp[x] = Math.min(dp[x], dp[x - coin] + 1);
                }
            }
        }
        return dp[amount] == Integer.MAX_VALUE ? -1 : dp[amount];
    }

    /** Đếm số cách (không tính thứ tự): vòng ngoài duyệt mệnh giá để không đếm 1+2 và 2+1 là 2 cách. */
    static long coinWays(int[] coins, int amount) {
        long[] dp = new long[amount + 1];
        dp[0] = 1;
        for (int coin : coins)
            for (int x = coin; x <= amount; x++)
                dp[x] += dp[x - coin];
        return dp[amount];
    }

    /** dp[i] = độ dài dãy tăng dài nhất KẾT THÚC tại i. O(n²). (Có cách O(n log n) dùng tìm kiếm nhị phân.) */
    static int longestIncreasingSubsequence(int[] a) {
        int[] dp = new int[a.length];
        int best = 0;
        for (int i = 0; i < a.length; i++) {
            dp[i] = 1;
            for (int j = 0; j < i; j++) {
                if (a[j] < a[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
            }
            best = Math.max(best, dp[i]);
        }
        return best;
    }

    /** DP hai chiều: dp[i][j] = LCS của a[0..i) và b[0..j). */
    static int longestCommonSubsequence(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];
        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1)
                        ? dp[i - 1][j - 1] + 1
                        : Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
        return dp[a.length()][b.length()];
    }

    /** Số thao tác thêm/xóa/thay ít nhất để biến a thành b (Levenshtein). */
    static int editDistance(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];
        for (int i = 0; i <= a.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= b.length(); j++) dp[0][j] = j;
        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(dp[i - 1][j - 1],           // thay
                            Math.min(dp[i - 1][j], dp[i][j - 1]));      // xóa, thêm
                }
            }
        }
        return dp[a.length()][b.length()];
    }
}
