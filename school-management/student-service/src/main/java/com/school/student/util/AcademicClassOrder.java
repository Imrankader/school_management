package com.school.student.util;

import java.util.Comparator;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class AcademicClassOrder {

    private static final Pattern CLASS_NUM_PATTERN = Pattern.compile("(?i)(?:CLASS|GRADE|STD)?\\s*(\\d+)");

    public static int getClassRank(String className) {
        if (className == null || className.trim().isBlank()) return 999;
        String normalized = className.trim().toUpperCase()
                .replaceAll("\\s+", " ")
                .replaceAll("GRADE\\s*", "CLASS ")
                .replaceAll("STD\\s*", "CLASS ");

        if (normalized.contains("PRE-KG") || normalized.contains("PREKG") || normalized.contains("PLAY")) return 1;
        if (normalized.equals("LKG") || normalized.startsWith("LKG") || normalized.contains("L.K.G")) return 2;
        if (normalized.equals("UKG") || normalized.startsWith("UKG") || normalized.contains("U.K.G")) return 3;

        Matcher matcher = CLASS_NUM_PATTERN.matcher(normalized);
        if (matcher.find()) {
            try {
                int num = Integer.parseInt(matcher.group(1));
                return 10 + num; // Class 1 -> 11, Class 2 -> 12, ..., Class 12 -> 22
            } catch (NumberFormatException ignored) {}
        }

        // Roman numerals
        if (normalized.endsWith(" XII") || normalized.equals("XII")) return 22;
        if (normalized.endsWith(" XI") || normalized.equals("XI")) return 21;
        if (normalized.endsWith(" X") || normalized.equals("X")) return 20;
        if (normalized.endsWith(" IX") || normalized.equals("IX")) return 19;
        if (normalized.endsWith(" VIII") || normalized.equals("VIII")) return 18;
        if (normalized.endsWith(" VII") || normalized.equals("VII")) return 17;
        if (normalized.endsWith(" VI") || normalized.equals("VI")) return 16;
        if (normalized.endsWith(" V") || normalized.equals("V")) return 15;
        if (normalized.endsWith(" IV") || normalized.equals("IV")) return 14;
        if (normalized.endsWith(" III") || normalized.equals("III")) return 13;
        if (normalized.endsWith(" II") || normalized.equals("II")) return 12;
        if (normalized.endsWith(" I") || normalized.equals("I")) return 11;

        return 999;
    }

    public static boolean isValidClass(String className) {
        return getClassRank(className) < 999;
    }

    public static int compareNatural(String s1, String s2) {
        if (s1 == null && s2 == null) return 0;
        if (s1 == null) return -1;
        if (s2 == null) return 1;

        int i1 = 0, i2 = 0;
        int len1 = s1.length(), len2 = s2.length();
        while (i1 < len1 && i2 < len2) {
            char c1 = s1.charAt(i1);
            char c2 = s2.charAt(i2);
            if (Character.isDigit(c1) && Character.isDigit(c2)) {
                int start1 = i1;
                while (i1 < len1 && Character.isDigit(s1.charAt(i1))) i1++;
                int start2 = i2;
                while (i2 < len2 && Character.isDigit(s2.charAt(i2))) i2++;
                String numStr1 = s1.substring(start1, i1).replaceFirst("^0+", "");
                String numStr2 = s2.substring(start2, i2).replaceFirst("^0+", "");
                if (numStr1.length() != numStr2.length()) {
                    return Integer.compare(numStr1.length(), numStr2.length());
                }
                int cmp = numStr1.compareTo(numStr2);
                if (cmp != 0) return cmp;
            } else {
                int diff = Character.toLowerCase(c1) - Character.toLowerCase(c2);
                if (diff != 0) return diff;
                i1++;
                i2++;
            }
        }
        return Integer.compare(len1 - i1, len2 - i2);
    }

    public static final java.util.List<String> EXCEL_CLASSES = java.util.List.of(
            "LKG", "UKG", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"
    );

    public static final java.util.List<String> APPLICATION_CLASSES = java.util.List.of(
            "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
            "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"
    );

    /**
     * Map application class names (e.g. "Class 10", "Class 3") to Excel format ("X", "III").
     * LKG -> LKG, UKG -> UKG
     * Class 1 -> I, Class 2 -> II, Class 3 -> III, Class 4 -> IV, Class 5 -> V, Class 6 -> VI
     * Class 7 -> VII, Class 8 -> VIII, Class 9 -> IX, Class 10 -> X, Class 11 -> XI, Class 12 -> XII
     */
    public static String toExcelClassName(String className) {
        if (className == null || className.trim().isBlank()) return "";
        String trimmed = className.trim();
        String upper = trimmed.toUpperCase().replaceAll("\\s+", " ");

        if (upper.equals("LKG") || upper.equals("L.K.G") || upper.equals("L.K.G.")) return "LKG";
        if (upper.equals("UKG") || upper.equals("U.K.G") || upper.equals("U.K.G.")) return "UKG";
        if (upper.equals("PRE-KG") || upper.equals("PREKG") || upper.equals("NURSERY")) return "LKG";

        // If already Roman numeral
        if (upper.equals("I")) return "I";
        if (upper.equals("II")) return "II";
        if (upper.equals("III")) return "III";
        if (upper.equals("IV")) return "IV";
        if (upper.equals("V")) return "V";
        if (upper.equals("VI")) return "VI";
        if (upper.equals("VII")) return "VII";
        if (upper.equals("VIII")) return "VIII";
        if (upper.equals("IX")) return "IX";
        if (upper.equals("X")) return "X";
        if (upper.equals("XI")) return "XI";
        if (upper.equals("XII")) return "XII";

        Matcher matcher = CLASS_NUM_PATTERN.matcher(upper);
        if (matcher.find()) {
            try {
                int num = Integer.parseInt(matcher.group(1));
                switch (num) {
                    case 1: return "I";
                    case 2: return "II";
                    case 3: return "III";
                    case 4: return "IV";
                    case 5: return "V";
                    case 6: return "VI";
                    case 7: return "VII";
                    case 8: return "VIII";
                    case 9: return "IX";
                    case 10: return "X";
                    case 11: return "XI";
                    case 12: return "XII";
                    default: return trimmed;
                }
            } catch (NumberFormatException ignored) {}
        }

        return trimmed;
    }

    /**
     * Map Excel Roman numerals (e.g. "X", "III") to application format ("Class 10", "Class 3").
     */
    public static String toApplicationClassName(String excelClass) {
        if (excelClass == null || excelClass.trim().isBlank()) return "";
        String trimmed = excelClass.trim();
        String upper = trimmed.toUpperCase().replaceAll("\\s+", " ");

        if (upper.equals("LKG") || upper.equals("L.K.G") || upper.equals("L.K.G.")) return "LKG";
        if (upper.equals("UKG") || upper.equals("U.K.G") || upper.equals("U.K.G.")) return "UKG";
        if (upper.equals("PRE-KG") || upper.equals("PREKG") || upper.equals("NURSERY")) return "LKG";

        if (upper.equals("I")) return "Class 1";
        if (upper.equals("II")) return "Class 2";
        if (upper.equals("III")) return "Class 3";
        if (upper.equals("IV")) return "Class 4";
        if (upper.equals("V")) return "Class 5";
        if (upper.equals("VI")) return "Class 6";
        if (upper.equals("VII")) return "Class 7";
        if (upper.equals("VIII")) return "Class 8";
        if (upper.equals("IX")) return "Class 9";
        if (upper.equals("X")) return "Class 10";
        if (upper.equals("XI")) return "Class 11";
        if (upper.equals("XII")) return "Class 12";

        Matcher matcher = CLASS_NUM_PATTERN.matcher(upper);
        if (matcher.find()) {
            try {
                int num = Integer.parseInt(matcher.group(1));
                return "Class " + num;
            } catch (NumberFormatException ignored) {}
        }

        return trimmed;
    }

    /**
     * Check if two class representations match (e.g. "Class 10" matches "X", "Class 3" matches "III").
     */
    public static boolean isClassMatch(String classA, String classB) {
        if (classA == null || classB == null) return false;
        String appA = toApplicationClassName(classA);
        String appB = toApplicationClassName(classB);
        return appA.equalsIgnoreCase(appB);
    }

    public static final Comparator<String> CLASS_COMPARATOR = (c1, c2) -> {
        int r1 = getClassRank(c1);
        int r2 = getClassRank(c2);
        if (r1 != r2) {
            return Integer.compare(r1, r2);
        }
        return String.CASE_INSENSITIVE_ORDER.compare(c1 != null ? c1 : "", c2 != null ? c2 : "");
    };
}
